app.controller('baseController', function($scope) {

    $scope.selectIds=[]; // 选中的id集合

    //加工id集合
    $scope.updateSelection=function($event, id) {
        // 判断是否选中
        // 事件目标检查
        if ($event.target.checked) {
            $scope.selectIds.push(id);
        } else {
            var index = $scope.selectIds.indexOf(id);
            $scope.selectIds.splice(index,1);// 删除
        }
    }

    //分页控件配置
    $scope.paginationConf = {
        currentPage: 1,
        totalItems: 10,
        itemsPerPage: 10,
        perPageOptions: [10, 20, 30, 40, 50],
        onChange: function(){
            // $scope.reloadList();//初始化，页码变化
            // 查询分页方法
            $scope.reloadList();
        }
    };

    //给定的集合中获取key对应的值，逗号拼接返回
    $scope.jsonToString=function(jsonString, key){
        //jsonString转成json
        var jsonArr = JSON.parse(jsonString);
        var value = "";
        for (var i=0;i<jsonArr.length;i++) {
            if (i > 0) {
                value += ",";
            }
            value += jsonArr[i][key];
        }

        return value;
    }

    $scope.searchObjectByKey=function(list,key,keyValue){//[],'attributeName','网络'
        for (var i=0;i<list.length;i++) {
            if (list[i][key] == keyValue){
                return list[i];
            }
        }
        return null;
    }

    $scope.reloadList=function () {
        $scope.search($scope.paginationConf.currentPage,$scope.paginationConf.itemsPerPage);
    }
})