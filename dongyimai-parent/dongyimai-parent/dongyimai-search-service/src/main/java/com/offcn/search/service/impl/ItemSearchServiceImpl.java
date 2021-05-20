package com.offcn.search.service.impl;

import com.alibaba.dubbo.config.annotation.Service;
import com.alibaba.fastjson.JSON;
import com.github.promeg.pinyinhelper.Pinyin;
import com.offcn.pojo.TbItem;
import com.offcn.search.service.ItemSearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.solr.core.SolrTemplate;
import org.springframework.data.solr.core.query.*;
import org.springframework.data.solr.core.query.result.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service(timeout = 3000)
public class ItemSearchServiceImpl implements ItemSearchService {

    @Autowired
    private SolrTemplate solrTemplate;

    @Override
    public Map<String, Object> search(Map searchMap) {

        //去空格
        String keywords = (String) searchMap.get("keywords");
        if(keywords !=null && keywords.length()>0){
            searchMap.put("keywords",keywords.replace(" ",""));
        }

        Map<String,Object> map = new HashMap();

        //1.查询列表
        map.putAll(searchList(searchMap));

        //2.根据关键字查询商品分类
        List categoryList = searchCategoryList(searchMap);
        map.put("categoryList",categoryList);

        //3.跟据分类名称查询缓存中对应的品牌和规格
        //读取分类名称
        String categoryName = (String) searchMap.get("category");
        if (!"".equals(categoryName)) {
            map.putAll(searchBrandAndSpecList(categoryName));
        } else {
            if(categoryList != null && categoryList.size()>0){
                map.putAll(searchBrandAndSpecList((String)categoryList.get(0)));
            }
        }

        return map;
    }

    @Override
    public void importItemData(List<TbItem> itemList) {
        for (TbItem item : itemList) {
            System.out.println(item.getTitle());

            //获取spec并json转换 //读取规格数据，字符串，转换成json对象
            Map<String,String> specMap = JSON.parseObject(item.getSpec(), Map.class);//{"机身内存":"16G","网络":"联通3G"}
            //创建一个新map集合存储拼音
            Map<String,String> pinYinMap = new HashMap();
            //遍历map，替换key从汉字变为拼音
            for (String key : specMap.keySet()) {//key=="机身内存"
                pinYinMap.put(Pinyin.toPinyin(key, "").toLowerCase(),specMap.get(key));
            }
            item.setSpecMap(pinYinMap);
        }

        //保存集合数据到solr
        solrTemplate.saveBeans(itemList);
        solrTemplate.commit();

        System.out.println("===结束===");
    }


    /**
     * 1.根据关键字查询，对查询的结果进行高亮
     */
    private Map searchList(Map searchMap) {
        Map map = new HashMap();

        //1、创建一个支持高亮查询器对象
        SimpleHighlightQuery query = new SimpleHighlightQuery();
        //2、设定需要高亮处理字段
        HighlightOptions highlightOptions = new HighlightOptions();
        highlightOptions.addField("item_title");
        //3、设置高亮前缀
        highlightOptions.setSimplePrefix("<em style='color:red'>");
        //4、设置高亮后缀
        highlightOptions.setSimplePostfix("</em>");
        //5、关联高亮选项到高亮查询器对象
        query.setHighlightOptions(highlightOptions);

        //6、设定查询条件 根据关键字查询
        //1.1 关键字
        Criteria criteria = new Criteria("item_keywords").is(searchMap.get("keywords"));//创建查询条件对象
        //关联查询条件到查询器对象
        query.addCriteria(criteria);

        //1.2 分类 过滤条件
        if (!"".equals(searchMap.get("category"))) {
            Criteria filterCriteria = new Criteria("item_category").is(searchMap.get("category"));
            FilterQuery filterQuery = new SimpleFacetQuery(filterCriteria);
            query.addFilterQuery(filterQuery);
        }

        //1.3 品牌 过滤条件
        if (!"".equals(searchMap.get("brand"))) {
            Criteria filterCriteria = new Criteria("item_brand").is(searchMap.get("brand"));
            FilterQuery filterQuery = new SimpleFacetQuery(filterCriteria);
            query.addFilterQuery(filterQuery);
        }

        //1.4 规格 过滤条件
        if (searchMap.get("spec") != null) {
            Map<String,String> specMap = (Map<String, String>) searchMap.get("spec");
            for (String key : specMap.keySet()) {
                Criteria filterCriteria = new Criteria("item_spec_"+ Pinyin.toPinyin(key,"").toLowerCase()).is(specMap.get(key));
                FilterQuery filterQuery = new SimpleFacetQuery(filterCriteria);
                query.addFilterQuery(filterQuery);
            }
        }

        //1.5 按价格筛选
        if (!"".equals(searchMap.get("price"))) {
            //截取
            String[] prices = ((String) searchMap.get("price")).split("-");
            if (!prices[0].equals("0")){//如果区间起点不等于0
                Criteria filterCriteria = new Criteria("item_price").greaterThanEqual(prices[0]);
                FilterQuery filterQuery = new SimpleFacetQuery(filterCriteria);
                query.addFilterQuery(filterQuery);
            }

            if (!prices[1].equals("*")){//如果区间终点不等于*
                Criteria filterCriteria = new Criteria("item_price").lessThanEqual(prices[1]);
                FilterQuery filterQuery = new SimpleFacetQuery(filterCriteria);
                query.addFilterQuery(filterQuery);
            }
        }
        //1.6
        Integer pageNo = (Integer) searchMap.get("pageNo");
        if(pageNo == null){
            pageNo = 1;
        }

        Integer pageSize = (Integer) searchMap.get("pageSize");
        if(pageNo == null){
            pageSize = 40;
        }
        query.setOffset((pageNo-1)*pageSize);
        query.setRows(pageSize);

        //1.7排序
        String  sortValue = (String) searchMap.get("sort");
        String  sortField = (String) searchMap.get("sortField");
        if (sortValue != null && !sortValue.equals("")){
            if(sortValue.equals("ASC")){
                Sort sort = new Sort(Sort.Direction.ASC,"item_" + sortField);
                query.addSort(sort);
            }
            if(sortValue.equals("DESC")){
                Sort sort = new Sort(Sort.Direction.DESC,"item_" + sortField);
                query.addSort(sort);
            }
        }

        //7、发出带高亮数据查询请求
        HighlightPage<TbItem> page = solrTemplate.queryForHighlightPage(query, TbItem.class);
        //8、获取高亮集合入口
        List<HighlightEntry<TbItem>> highlightEntryList = page.getHighlighted();
        //9、遍历高亮集合
        for (HighlightEntry<TbItem> highlightEntry : highlightEntryList) {
            //获取基本数据对象
            TbItem tbItem = highlightEntry.getEntity();// title没有高亮样式

            if (highlightEntry.getHighlights().size()>0&&highlightEntry.getHighlights().get(0).getSnipplets().size()>0) {
                List<HighlightEntry.Highlight> highlightList = highlightEntry.getHighlights();
                //高亮结果集合
                List<String> snipplets = highlightList.get(0).getSnipplets();
                //获取第一个高亮字段对应的高亮结果，设置到商品标题
                tbItem.setTitle(snipplets.get(0));
            }
        }

        //把带高亮数据集合存放map
        map.put("rows",page.getContent());
        map.put("totalPages",page.getTotalPages());
        map.put("total",page.getTotalElements());

        return map;
    }

    /**
     * 根据关键字查询分类
     */
    private List searchCategoryList(Map searchMap) {
        List<String> list = new ArrayList();

        //select category from tb_item where brand = '三星' GROUP BY category
        Query query = new SimpleQuery();//select *
        //按照关键字查询
        Criteria criteria = new Criteria("item_keywords").is(searchMap.get("keywords"));
        query.addCriteria(criteria);
        //设置分组选项
        GroupOptions groupOptions = new GroupOptions().addGroupByField("item_category");
        query.setGroupOptions(groupOptions);
        //得到分组页
        GroupPage<TbItem> page = solrTemplate.queryForGroupPage(query, TbItem.class);
        //根据列得到分组结果集
        GroupResult<TbItem> groupResult = page.getGroupResult("item_category");
        //得到分组结果入口页
        Page<GroupEntry<TbItem>> groupEntries = groupResult.getGroupEntries();
        //得到分组入口集合
        List<GroupEntry<TbItem>> content = groupEntries.getContent();
        for (GroupEntry<TbItem> entry : content) {
            list.add(entry.getGroupValue());//将分组结果的名称封装到返回值中
        }
        return list;
    }

    @Autowired
    private RedisTemplate redisTemplate;

    /**
     * 跟据分类名称查询缓存中对应的品牌和规格
     * @param category 分类名称
     * @return
     */
    private Map searchBrandAndSpecList(String category) {
        Map map = new HashMap();

        //获取模板ID
        Long typeId  = (Long) redisTemplate.boundHashOps("itemCat").get(category);

        if (typeId != null) {
            //根据模板ID查询品牌列表
            List brandList = (List) redisTemplate.boundHashOps("brandList").get(typeId);
            map.put("brandList", brandList);//返回值添加品牌列表

            //根据模板ID查询规格列表
            List specList = (List) redisTemplate.boundHashOps("specList").get(typeId);
            map.put("specList", specList);
        }

        return map;
    }
}