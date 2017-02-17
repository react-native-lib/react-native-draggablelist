# react native draggableList

## Demo
    
![demo](https://raw.githubusercontent.com/hzzcc/react-native-dragablelist/master/Image/example.gif)

## How do I use it?
    
### Installation
    
    npm install react-native-draggablelist
   
### Use in your code

    var DraggableList = require('react-native-draggablelist');

    <DraggableList
                    isScrollView={false}
                    dataSource={datas}
                    keys={keys}
                    
                    containerStyle={{}}
                    contentStyle={{ }}
                    cellStyle={{width:this.baseItemWidth, height:this.baseItemHeight}}
    
                    toggleScroll={(can)=>{
                        this.setState({
                            scrollable: can,
                        })
                        if(!can){
                            this.setState({
                                isEditing:true
                            })
                        }
                   }}
                    renderCell={(rowData)=>{
                        {/*console.log("renderCell:", rowData);*/}
                        return self.renderBaseById(rowData.id, SectionType.TypeSelected);
                   }}
                    onMove={(newKeys)=>{
                       console.log("newKeys:", newKeys);
                       newKeys = newKeys.map((key)=>{
                           return parseInt(key);
                       })
                       self.setState({selectedItems:newKeys})
                   }}
                />
            
    isScrollView:       is scrollView or view, 
    dataSource:     isRequired, array of your data include id, like [{id: '1', name: ''}, {id: '2', name: ''}]
    keys:               you can also pass data orders, like ['2','1'], but it should be same with your data ids
    
    containerStyle: container style
    contentStyle: content style
    cellStyle:cell style
    

    shouldUpdateId:     the cell should be update
    shouldUpdate:       update all cell
    
    renderCell:         render cell
    toggleScroll:       if isScrollView is false, and outside component is a scrollView, should set the callback for scrollEnabled state
    onMove:             callback function, return the orders of cell by id(string)
    onPressCell:        when cell pressed 

#### Simplest sample use is :
            
            <DraggableList
                                isScrollView={false}
                                dataSource={[{id:1}, {id:2}]}
                                keys={[1,2]}
                                
                                renderCell={(rowData)=>{
                                    {/*console.log("renderCell:", rowData);*/}
                                    return (<Text>{rowData.id}</Text>);
                               }}
                            />

#### fork from [react-native-dragablelist](https://github.com/hzzcc/react-native-dragablelist.git)

     原来的项目不支持flexWrap

