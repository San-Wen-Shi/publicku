 //控制层 
app.controller('contentController' ,function($scope,contentService){

	$scope.contentList=[];//广告集合

	//轮播
	$scope.findByCategoryId=function(categoryId){
		contentService.findByCategoryId(categoryId).success(
			function(response){
				$scope.contentList[categoryId]= response;
			}
		);				
	}
	$scope.search=function () {
		location.href = "http://localhost:9104/search.html#?keywords=" + $scope.keywords;
	}

});	