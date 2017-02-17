'use strict';

import React, {PropTypes} from "react";
import {View, ScrollView, LayoutAnimation, StyleSheet, Animated} from "react-native";

var AnimatedCell = require('./AnimatedCell');
var invariant = require('invariant');
var TimerMixin = require('react-timer-mixin');
var _ = require('lodash');

var DragableList = React.createClass({
    mixins: [TimerMixin],

    propTypes: {
        isScrollView: PropTypes.bool.isRequired, //scrollView or view
        dataSource: PropTypes.array.isRequired, //data
        keys: PropTypes.array, //pre orders of data

        containerStyle: View.propTypes.style, //scroll view style
        contentStyle: View.propTypes.style, //scroll view style
        cellStyle: View.propTypes.style, //cell props

        shouldUpdateId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), //需要更新的cell id
        shouldUpdate: PropTypes.bool, //update all cell

        onMove: PropTypes.func, //callback of move
        onPressCell: PropTypes.func, //
        toggleScroll: PropTypes.func, //if isScrollView is false, and outside component is a scrollView, should set this
    },

    getDefaultProps() {
        return {
        };
    },

    getInitialState() {
        var keys = [];
        var keyGroups = {};
        var dataSource = this.props.dataSource || [];
        if (this.props.keys && this.props.keys.length > 0) {
            keys = this.props.keys;
            keys = keys.map((key)=>{
                return key.toString();
            })
            for (var i = 0; i < dataSource.length; i++) {
                var item = dataSource[i];
                var key = item.id.toString();
                keyGroups[key] = item;
            }
        }else{
            for (var i = 0; i < dataSource.length; i++) {
                var item = dataSource[i];
                var key = item.id.toString();
                keys[i] = key;
                keyGroups[key] = item;
            }
        }

        invariant(keys.length == this.props.dataSource.length, 'dataSource length should be equal to keys length');

        return {
            keys: keys,
            key_groups: keyGroups,

            restLayouts: [],
            scrollable: true,
            shouldUpdate: false,
        }
    },

    setKeyGroups(dataSource) {
        var keyGroups = {};
        for (var i = 0; i < dataSource.length; i++) {
            var item = dataSource[i];
            var key = item.id.toString();
            keyGroups[key] = item;
        }
        return keyGroups;
    },

    componentWillReceiveProps(nextProps) {
        var {dataSource} = nextProps;

        if (dataSource) {

            var key_groups = this.setKeyGroups(dataSource);
            if (this.state.keys.length > dataSource.length) { //delete some data
                var newKeys = _.map(dataSource, (item) => {
                    return item.id.toString();
                });
                newKeys = _.intersection(this.state.keys, newKeys);
                console.log("componentWillReceiveProps: newKeys1:", newKeys)
                this.setState({
                    keys: newKeys,
                    key_groups,
                })
            }else if (this.state.keys.length < dataSource.length){ //add some data
                var newKeys = _.map(dataSource, (item) => {
                    return item.id.toString();
                });
                newKeys = _.union(this.state.keys, newKeys);
                console.log("componentWillReceiveProps: newKeys2:", newKeys)
                this.setState({
                    keys: newKeys,
                    key_groups,
                })
            }else{
                // console.log("componentWillReceiveProps:", key_groups);
                // this.setState({
                //     key_groups,
                //     shouldUpdate:true
                // })
            }
        }
    },

    reloadItems(){
        this.setState({
            shouldUpdate:true
        }, ()=>{
            this.setState({shouldUpdate:false});
        })

        // this.setState({
        //     shouldUpdate:true
        // })
    },

    setTimeoutId: null,
    //animate
    _onMove(position: Point): void {
        // console.log("_onMove:", position);
        var newKeys = moveToClosest(this.state, position);
        if (newKeys !== this.state.keys) {
            // console.log("_onMove newKeys:", newKeys);
            LayoutAnimation.easeInEaseOut();
            this.setState({keys: newKeys});
            this.props.onMove && this.props.onMove(newKeys);
        }
    },

    toggleScroll: function (can, callback) {
        this.props.toggleScroll && this.props.toggleScroll(can, callback)
        if (this.props.isScrollView) {
            this.setState({
                scrollable: can
            }, callback);
        }else{
            if(callback)callback();
        }
    },

    render() {
        // console.log("DraggableList:render:data:", this.state.key_groups);
        var content = <View />;

        var cellStyle = this.props.cellStyle;

        var shouldUpdateId = null;
        if (this.props.shouldUpdateId !== null && this.props.shouldUpdateId !== undefined) {
            shouldUpdateId = this.props.shouldUpdateId.toString();
        }

        if (this.state.keys.length > 0) {

            content = this.state.keys.map((key, idx) => {
                if (key === null || key === undefined) return;
                var row_data = this.state.key_groups[key];

                var shouldUpdate = this.props.shouldUpdate || this.state.shouldUpdate || (shouldUpdateId == key);
                if (key == this.state.activeKey) {
                    return (
                        <AnimatedCell
                            key={key + 'd'}
                            keyName={key + 'd'}

                            dummy={true}

                            cellStyle={cellStyle}
                            rowData={row_data}
                            onPressCell={this.props.onPressCell}
                            shouldUpdate={shouldUpdate}
                            shouldUpdateId={this.props.shouldUpdateId}
                            renderCell={this.props.renderCell}
                        />
                    );
                } else {
                    if (!this.state.restLayouts[idx]) {
                        var onLayout = function(index, e) {
                            var layout = e.nativeEvent.layout;
                            // console.log("onLayout:", layout, "index:", index);
                            this.setState((state) => {
                                state.restLayouts[index] = layout;
                                return state;
                            });
                        }.bind(this, idx);
                    }
                    return (
                        <AnimatedCell
                            key={key}
                            keyName={key}

                            onLayout={onLayout}
                            restLayout={this.state.restLayouts[idx]}
                            onActivate={() => {
                                {/*console.log("onActivate:", key, " idx:", idx);*/}
                                this.setState({
                                    shouldUpdate: true,
                                    activeKey: key,
                                    activeInitialLayout: this.state.restLayouts[idx],
                                })
                            }}

                            toggleScroll={this.toggleScroll}
                            cellStyle={cellStyle}
                            rowData={row_data}
                            onPressCell={this.props.onPressCell}
                            shouldUpdate={shouldUpdate}
                            shouldUpdateId={this.props.shouldUpdateId}
                            renderCell={this.props.renderCell}
                        />
                    );
                }
            });
            if (this.state.activeKey) {
                var row_data = this.state.key_groups[this.state.activeKey];
                var shouldUpdate = this.state.shouldUpdate || (shouldUpdateId == this.state.activeKey);
                content.push(
                    <AnimatedCell
                        key={this.state.activeKey}
                        keyName={this.state.activeKey}

                        restLayout={this.state.activeInitialLayout}
                        onMove={this._onMove}
                        onDeactivate={() => {
                            this.setState({
                                shouldUpdate: false,
                                activeKey: undefined
                            });
                        }}

                        toggleScroll={this.toggleScroll}
                        cellStyle={cellStyle}
                        rowData={row_data}
                        onPressCell={this.props.onPressCell}
                        shouldUpdate={shouldUpdate}
                        shouldUpdateId={this.props.shouldUpdateId}
                        renderCell={this.props.renderCell}
                    />
                );
            }
        }

        var ViewTag = this.props.isScrollView ? ScrollView : View;

        return (
            <ViewTag
                style={this.props.containerStyle}
                scrollEnabled={this.state.scrollable}
                automaticallyAdjustContentInsets={false}
                showsVerticalScrollIndicator={false}
                contentInset={{bottom: 0}}
            >
                <View style={[{flexGrow: 1, flexDirection:'row', flexWrap:'wrap'}, this.props.contentStyle]}>
                    {content}
                </View>
            </ViewTag>
        )
    }
});

function distance(p1, p2) {
    if (!p1 || !p2) return 0;
    var dx = p1.x - p2.x;
    var dy = p1.y - p2.y;
    return dx * dx + dy * dy;
}

function moveToClosest({activeKey, keys, restLayouts}, position) {
    var activeIdx = -1;
    var closestIdx = activeIdx;
    var minDist = Infinity;
    var newKeys = [];
    keys.forEach((key, idx) => {
        var dist = distance(position, restLayouts[idx]);
        if (key === activeKey) {
            idx = activeIdx;
        } else {
            newKeys.push(key);
        }
        if (dist < minDist) {
            minDist = dist;
            closestIdx = idx;
        }
    });
    if (closestIdx === activeIdx) {
        return keys;
    } else {
        newKeys.splice(closestIdx, 0, activeKey);
        return newKeys;
    }
}


module.exports = DragableList;