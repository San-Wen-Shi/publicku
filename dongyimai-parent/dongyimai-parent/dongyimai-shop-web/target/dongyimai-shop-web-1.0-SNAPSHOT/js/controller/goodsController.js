//控制层
app.controller('goodsController', function ($scope, $controller, $location, goodsService, itemCatService, uploadService, typeTemplateService) {

    $controller('baseController', {$scope: $scope});//继承

    //读取列表数据绑定到表单中  
    $scope.findAll = function () {
        goodsService.findAll().success(
            function (response) {
                $scope.list = response;
            }
        );
    }

    //分页
    $scope.findPage = function (page, rows) {
        goodsService.findPage(page, rows).success(
            function (response) {
                $scope.list = response.rows;
                $scope.paginationConf.totalItems = response.total;//更新总记录数
            }
        );
    }

    //查询实体
    $scope.findOne = function () {

        var id = $location.search()['id'];//获取参数值
        if (id == null) {
            return;
        }

        goodsService.findOne(id).success(
            function (response) {
                $scope.entity = response;

                //向富文本编辑器添加商品介绍
                editor.html($scope.entity.goodsDesc.introduction);

                //显示图片列表的json转换
                $scope.entity.goodsDesc.itemImages = JSON.parse($scope.entity.goodsDesc.itemImages);

                //显示扩展属性的json转换
                $scope.entity.goodsDesc.customAttributeItems = JSON.parse($scope.entity.goodsDesc.customAttributeItems);

                //规格的json转换
                $scope.entity.goodsDesc.specificationItems = JSON.parse($scope.entity.goodsDesc.specificationItems);

                //item中spec json转换
                for (var i=0;i<$scope.entity.itemList.length;i++) {
                    $scope.entity.itemList[i].spec = JSON.parse($scope.entity.itemList[i].spec);
                }
            }
        );
    }

    //保存
    $scope.save = function () {

        //判断还是修改
        var serviceObject;
        if ($scope.entity.goods.id != null) {
            serviceObject = goodsService.update($scope.entity);
        } else {
            serviceObject = goodsService.add($scope.entity);
        }

        //获取富文本的内容
        $scope.entity.goodsDesc.introduction = editor.html();

        serviceObject.success(
            function (response) {
                if (response.success) {
                    //重新查询
                    // alert("保存成功");
                    // $scope.entity = {goods: {}, goodsDesc: {itemImages: [], specificationItems: []}, itemList: []};
                    // editor.html('');//清空富文本编辑器
                    location.href = 'goods.html';
                } else {
                    alert(response.message);
                }
            }
        );
    }


    //批量删除
    $scope.dele = function () {
        //获取选中的复选框
        goodsService.dele($scope.selectIds).success(
            function (response) {
                if (response.success) {
                    $scope.reloadList();//刷新列表
                    $scope.selectIds = [];
                }
            }
        );
    }

    $scope.searchEntity = {};//定义搜索对象

    //搜索
    $scope.search = function (page, rows) {
        goodsService.search(page, rows, $scope.searchEntity).success(
            function (response) {
                $scope.list = response.rows;
                $scope.paginationConf.totalItems = response.total;//更新总记录数
            }
        );
    }

    $scope.image_entity = {};
    //上传图片
    $scope.uploadFile = function () {
        uploadService.uploadFile().success(
            function (response) {
                if (response.success) {//如果上传成功，取出url
                    $scope.image_entity.url = response.message;//设置文件地址
                } else {
                    alert(response.message);
                }
            }
        );
    }


    $scope.entity = {goods: {}, goodsDesc: {itemImages: [], specificationItems: []}, itemList: []};//定义页面实体结构 组合实体类
    //添加图片列表
    $scope.add_image_entity = function () {
        $scope.entity.goodsDesc.itemImages.push($scope.image_entity);
    }

    //列表中移除图片
    $scope.remove_image_entity = function (index) {
        $scope.entity.goodsDesc.itemImages.splice(index, 1);
    }

    //读取一级分类
    $scope.selectItemCat1List = function () {
        itemCatService.findByParentId(0).success(
            function (response) {
                $scope.itemCat1list = response;
            }
        );
    }

    //读取二级分类
    $scope.$watch('entity.goods.category1Id', function (newValue, oldValue) {
        //判断一级分类有选择具体分类值，在去获取二级分类
        if (newValue) {
            // 初始化
            $scope.itemCat3list = {};
            $scope.entity.goods.typeTemplateId = undefined;
            //根据选择的值，查询二级分类
            itemCatService.findByParentId(newValue).success(
                function (response) {
                    $scope.itemCat2list = response;
                }
            );
        }
    })


    //读取三级分类
    $scope.$watch('entity.goods.category2Id', function (newValue, oldValue) {
        //判断二级分类有选择具体分类值，在去获取三级分类
        if (newValue) {
            // 初始化
            //根据选择的值，查询三级分类
            itemCatService.findByParentId(newValue).success(
                function (response) {
                    $scope.itemCat3list = response;
                }
            );
        }
    })

    //三级分类选择后  读取模板ID  四级-1
    $scope.$watch('entity.goods.category3Id', function (newValue, oldValue) {
        //判断三级分类被选中，在去获取更新模板id
        if (newValue) {
            itemCatService.findOne(newValue).success(
                function (response) {
                    //更新模板ID
                    $scope.entity.goods.typeTemplateId = response.typeId;
                }
            );
        }
    })

    //四级-1
    $scope.$watch('entity.goods.typeTemplateId', function (newValue, oldValue) {
        if (newValue) {
            //根据模板id查询模板(品牌，规格，扩展属性)
            typeTemplateService.findOne(newValue).success(
                function (response) {
                    $scope.typeTemplate = response;

                    //对品牌列表json转换
                    $scope.typeTemplate.brandIds = JSON.parse($scope.typeTemplate.brandIds);

                    if ($location.search()['id'] == null) {
                        $scope.entity.goodsDesc.customAttributeItems = JSON.parse($scope.typeTemplate.customAttributeItems);
                    }
                }
            );

            //查询规格及规格项
            typeTemplateService.findSpecList(newValue).success(
                function (response) {
                    $scope.specList = response;
                }
            );
        }
    })

    //$scope.entity={goods:{},goodsDesc:{itemImages:[],specificationItems:[]},itemList:[]};
    $scope.updateSpecAttribute = function ($event, name, value) {

        //先判断 searchObjectByKey
        var object = $scope.searchObjectByKey($scope.entity.goodsDesc.specificationItems, 'attributeName', name);

        if (object != null) {
            if ($event.target.checked) {
                object.attributeValue.push(value);
            } else {
                //取消勾选
                object.attributeValue.splice(object.attributeValue.indexOf(value), 1);
                if (object.attributeValue.length == 0) {
                    $scope.entity.goodsDesc.specificationItems.splice($scope.entity.goodsDesc.specificationItems.indexOf(object), 1);
                }
            }
        } else {
            $scope.entity.goodsDesc.specificationItems.push({"attributeName": name, "attributeValue": [value]});
        }
    }

    $scope.createItemList=function () {

        $scope.entity.itemList=[{spec:{},price:0,num:99999,status:'0',isDefault:'0'}];

        var items = $scope.entity.goodsDesc.specificationItems;
        for (var i=0;i<items.length;i++) {

            $scope.entity.itemList = addColumn($scope.entity.itemList,items[i].attributeName,items[i].attributeValue);
        }
    }

    addColumn=function (list,columnName,columnValues) {//返回加工后的集合
        var newList=[]

        for (var i=0;i<list.length;i++) {
            var oldRow = list[i];//{spec:{},price:0,num:99999,status:'0',isDefault:'0'}
            for (var j=0;j<columnValues.length;j++) {
                var newRow = JSON.parse(JSON.stringify(oldRow));//浅克隆，指向同一个地址，拷贝地址
                //itemListNew = {spec:{},price:0,num:99999,status:'0',isDefault:'0'}
                newRow.spec[columnName] = columnValues[j];//{spec:{网络:联通3G},price:0,num:99999,status:'0',isDefault:'0'}
                newList.push(newRow);
            }
        }

        return newList;
    }

    $scope.status=['未审核','已审核','审核未通过','关闭'];//商品状态

    $scope.itemCatList=[];//商品分类列表

    //加载商品分类列表
    //查询全部商品分类，id作为下标，name作为值，重新放入到指定数组中. id
    $scope.findItemCatList=function(){
        itemCatService.findAll().success(
            function (response) {
                for (var i = 0;i<response.length;i++) {
                    $scope.itemCatList[response[i].id] = response[i].name;
                }
            }
        );
    }

    $scope.checkAttributeValue=function (specName, optionName) {
        var items = $scope.entity.goodsDesc.specificationItems;

        var object = $scope.searchObjectByKey(items,'attributeName',specName);
        if (object == null) {
            return false;
        } else {
            if (object.attributeValue.indexOf(optionName) >= 0) {
                return true;
            } else {
                return false;
            }
        }
    }
});
