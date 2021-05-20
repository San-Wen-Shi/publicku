//控制层
app.controller('searchController' ,function($scope,$location,searchService){
	$scope.searchMap = {};
	$scope.searchMap={'keywords':'','category':'','brand':'','spec':{},'price':'','pageNo':1,'pageSize':20,'sort':'sortField'};//搜索对象

	//搜索
	$scope.search=function(){
		$scope.searchMap.pageNo = parseInt($scope.searchMap.pageNo);
		searchService.search($scope.searchMap).success(
			function(response){
				$scope.resultMap = response;//搜索返回的结果

				buildPageLael();
			}
		);
	}

	//添加搜索项
	$scope.addSearchItem=function(key,value){
		if (key=='category' || key=='brand' || key=='price') {//如果点击的是分类或者是品牌
			$scope.searchMap[key] = value;
		} else {
			$scope.searchMap.spec[key] = value;
		}

		$scope.search();//执行搜索
	}

	//移除复合搜索条件
	$scope.removeSearchItem=function (key) {
		if (key=='category' || key=='brand' || key=='price') {//如果是分类或品牌
			$scope.searchMap[key] = "";
		} else {//否则是规格
			delete $scope.searchMap.spec[key];//移除此属性
		}

		$scope.search();//执行搜索
	}

	//根据页码查询
	$scope.queryByPage=function(pageNo){
		//页码验证
		if (pageNo<1 || pageNo>$scope.searchMap.totalPages) {
			return;
		}
	}
	//构建分页标签(totalPages为总页数)
	buildPageLael=function(){
		$scope.pageLabel=[];

		var maxPageNo =  $scope.resultMap.totalPages;
		var firstPage = 1;
		var lastPage = maxPageNo;//后台

		$scope.firstDot=true;
		$scope.lastDot=true;
		if(lastPage > 5) {
			//头 start = 1 ，当前页1，2，3 start=1 end = 5
			if ($scope.searchMap.pageNo <= 3) {
				$scope.firstDot = false;
				lastPage = 5;
			} else if ($scope.searchMap.pageNo >= lastPage - 2) {//尾 当前页98，99，100 当前页 >= 100-2
				firstPage = maxPageNo - 4;
				$scope.lastDot = false;
			} else {//中间 start -2  end = 当前页+2
				firstPage = $scope.searchMap.pageNo - 2;
				lastPage = $scope.searchMap.pageNo + 2;
			}
		}else {
			$scope.firstDot=false;
			$scope.lastDot=false;
		}
		//页面数组的加工
		for (var i = firstPage;i <= lastPage;i++){
			$scope.pageLabel.push(i);
		}
	}


	$scope.queryByPage=function (pageNo) {
		if (pageNo < 1 || pageNo > $scope.resultMap.totalPages){
			return;
		}
		$scope.searchMap.pageNo = pageNo;
		$scope.search();
	}
	//上一页，下一页的样式
	$scope.isTopPage = function () {
		if ($scope.searchMap.pageNo == 1){
			return true;
		}else{
			return false;
		}
	}

	$scope.isEndPage = function () {
		if ($scope.searchMap.pageNo == $scope.resultMap.totalPages){
			return true;
		}else{
			return false;
		}
	}
	$scope.isPage = function (p) {
		if (parseInt(p) == parseInt($scope.searchMap.pageNo)){
			return true;
		}else{
			return false;
		}
	}
	$scope.sortSearch=function (sortField,sort) {
		$scope.searchMap.sortField = sortField;
		$scope.searchMap.sort = sort;
		$scope.search();
	}
	$scope.keywordsIsBrand=function () {
		for(var i = 0;i < $scope.resultMap.brandList.length;i++){
			if($scope.searchMap.keywords.indexOf($scope.searchMap.brandList[i].text) >= 0){
					return true;
			}
		}
		return false;
	}
	$scope.loadkeywords=function () {
		$scope.searchMap.keywords = $location.search()['keywords'];
		$scope.search();
	}

});