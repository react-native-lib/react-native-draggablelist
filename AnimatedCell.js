/**
 * Created by lijinchao(joshua) on 17/2/17.
 */
'use strict';

import React, {PropTypes} from "react";
import {Animated, LayoutAnimation, PanResponder, StyleSheet, Easing, Text} from "react-native";

var TimerMixin = require('react-timer-mixin');

var AnimateCell = React.createClass({

    mixins: [TimerMixin],

    propTypes: {
        disableDrag: PropTypes.bool.isRequired, //scrollView or view

        shouldUpdateId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), //需要更新的cell id
        shouldUpdate:PropTypes.bool,
        dummy:PropTypes.bool,
        restLayout:PropTypes.any,
        rowData:PropTypes.any,

        keyName:PropTypes.any,

        renderCell: PropTypes.func,
        onLayout: PropTypes.func,
        onActivate: PropTypes.func,
        onDeactivate: PropTypes.func,
        onMove: PropTypes.func, //callback of move
        onPressCell: PropTypes.func,
        toggleScroll: PropTypes.func, //if isScrollView is false, and outside component is a scrollView, should set this
    },


    getInitialState: function () {
        return {
            pan: new Animated.ValueXY(), // 减少样本矢量.
            pop: new Animated.Value(0),  // 初值.
            shouldUpdate: false,
            panResponder:undefined,
        };
    },


    shouldComponentUpdate(nextProps, nextState) {
        // console.log("AnimateCell shouldComponentUpdate1:", nextProps);
        // console.log("AnimateCell shouldComponentUpdate2:", nextState);
        // console.log("AnimateCell shouldComponentUpdate3:", this.state.shouldUpdate);
        if(nextProps.shouldUpdate || (nextState.shouldUpdate !== this.state.shouldUpdate)) {
            return true;
        }
        return false;
    },

    _onLongPress(): void {
        // console.log("_onLongPress");
        this.props.toggleScroll(false, this.toSetPanResponder);
    },

    toSetPanResponder() {
        // console.log("toSetPanResponder");
        var config = {tension: 0, friction: 3, velocity: 1, deceleration: 0.97, duration:300, easing: Easing.linear};
        this.state.pan.addListener((value) => {  //监听value的改变
            this.props.onMove && this.props.onMove(value);
        });
        Animated.spring(this.state.pop, {
            toValue: 1,                  // pop到这个值，即节点变大
            ...config,
        }).start();
        this.setState({panResponder: PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: Animated.event([
                null,                                         // native event - ignore
                {dx: this.state.pan.x, dy: this.state.pan.y}, // links pan 这里设置关联的pan偏移量
            ]),
            onPanResponderTerminate: (evt, gestureState) => {
                console.log('onPanResponderTerminate:', this.props.keyName);

                this.props.toggleScroll(true);

                LayoutAnimation.easeInEaseOut();  // animates layout update as one batch
                Animated.spring(this.state.pop, {
                    toValue: 0,                     // Pop back to 0
                    ...config,
                }).start();
                this.setState({panResponder: undefined});
                this.props.onMove && this.props.onMove({
                    x: gestureState.dx + this.props.restLayout.x,
                    y: gestureState.dy + this.props.restLayout.y,
                });
                this.props.onActivate && this.props.onActivate();
                this.props.onDeactivate && this.props.onDeactivate();

                this.setState({shouldUpdate: false});
            },
            onPanResponderRelease: (e, gestureState) => {
                console.log('onPanResponderRelease:', this.props.keyName);
                LayoutAnimation.easeInEaseOut();  // animates layout update as one batch
                Animated.spring(this.state.pop, {
                    toValue: 0,                     // Pop back to 0
                    ...config,
                }).start();
                this.setState({panResponder: undefined});
                this.props.onMove && this.props.onMove({
                    x: gestureState.dx + this.props.restLayout.x,
                    y: gestureState.dy + this.props.restLayout.y,
                });
                this.props.onDeactivate();
                this.setState({shouldUpdate: false});
                this.props.toggleScroll(true);
            },
        })}, () => {
            this.setState({shouldUpdate: true});
            // console.log('onActivate');
            this.props.onActivate();
        });
    },

    //拖拽起来的时候，会为Animated.View注册onPanResponderTerminate，如果不用empty清理，会在第二次的时候触发，引起错误
    emptyPanResponder:PanResponder.create({
        onStartShouldSetPanResponder: () => false,
    }),

    render(): ReactElement {
        // console.log("render restLayout:", this.props.rowData.id, ":", this.props.restLayout);
        var dragStyle = {
            position: 'relative',
            transform:[{'translate':[0,0,0]}],
        }
        if (this.state.panResponder) {
            var handlers = this.state.panResponder.panHandlers;

            var tmpLayout = this.state.pan.getLayout();
            dragStyle = {                 //  Used to position while dragging
                position: 'absolute',           //  Hoist out of layout
                left: 0,
                right: 0,
                transform:[{'translate':[0,0,1]}],
                ...tmpLayout,  //  Convenience converter
            };
        } else {
            var oriPageXY = {pageX: 0, pageY: 0};
            handlers = {
                ...this.emptyPanResponder.panHandlers,
                onStartShouldSetResponder: () => !this.props.disableDrag,
                onResponderGrant: (evt, gestureState) => {
                    console.log("onResponderGrant:", this.props.keyName);
                    this.state.pan.setValue({x: 0, y: 0});           // reset
                    this.state.pan.setOffset(this.props.restLayout); // offset from onLayout
                    this.longTimer = this.setTimeout(this._onLongPress, 300);
                    var evt_native = evt.nativeEvent;
                    oriPageXY = {pageX: evt_native.pageX, pageY: evt_native.pageY };
                },
                onResponderMove: (evt, gestureState) => {
                    console.log('onResponderMove:', this.props.keyName);
                    var evt_native = evt.nativeEvent;
                    this.setState({shouldUpdate: false});
                    this.clearTimeout(this.longTimer);
                },
                onResponderRelease: () => {
                    console.log('onResponderRelease:', this.props.keyName);

                    if (!this.state.panResponder) {
                        this.setState({shouldUpdate: false, panResponder: undefined});
                        this.clearTimeout(this.longTimer);
                        //this.props.onDeactivate && this.props.onDeactivate();
                        this.props.toggleScroll(true);
                        this.props.onPressCell && this.props.onPressCell(this.props.rowData);
                        console.log('onResponderRelease _toggleIsActive');
                    }else{
                        this.setState({shouldUpdate: false});
                    }
                }
            };
        }
        var animatedStyle: Object = {
            shadowOpacity: this.state.pop,    // no need for interpolation
            transform: [
                {
                    scale: this.state.pop.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.05]
                    })
                }
            ],
        };
        if (this.props.dummy) {
            animatedStyle.opacity = 0;
        }

        var shouldUpdate = this.state.shouldUpdate || (this.props.shouldUpdateId == this.props.rowData.id);
        var props = {...handlers, shouldUpdate: shouldUpdate};

        return (
            <Animated.View
                {...props}
                onLayout={this.props.onLayout}
                style={[styles.dragView, dragStyle, animatedStyle, this.props.cellStyle]}
            >
                {this.props.renderCell(this.props.rowData, props)}
            </Animated.View>
        );
    },

});

var styles = StyleSheet.create({
    dragView: {
        shadowRadius: 10,
        shadowColor: 'rgba(0,0,0,0.7)',
        shadowOffset: {height: 8},
        backgroundColor: 'transparent',
    },
});

module.exports = AnimateCell;