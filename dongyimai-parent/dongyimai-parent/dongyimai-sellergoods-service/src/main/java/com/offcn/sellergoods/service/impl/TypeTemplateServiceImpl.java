package com.offcn.sellergoods.service.impl;
import java.util.List;
import java.util.Map;

import com.alibaba.fastjson.JSON;
import com.offcn.mapper.TbSpecificationOptionMapper;
import com.offcn.pojo.TbSpecificationOption;
import com.offcn.pojo.TbSpecificationOptionExample;
import org.springframework.beans.factory.annotation.Autowired;
import com.alibaba.dubbo.config.annotation.Service;
import com.github.pagehelper.Page;
import com.github.pagehelper.PageHelper;
import com.offcn.mapper.TbTypeTemplateMapper;
import com.offcn.pojo.TbTypeTemplate;
import com.offcn.pojo.TbTypeTemplateExample;
import com.offcn.pojo.TbTypeTemplateExample.Criteria;
import com.offcn.sellergoods.service.TypeTemplateService;

import com.offcn.entity.PageResult;
import org.springframework.data.redis.core.RedisTemplate;

/**
 * 服务实现层
 * @author Administrator
 *
 */
@Service
public class TypeTemplateServiceImpl implements TypeTemplateService {

	@Autowired
	private TbTypeTemplateMapper typeTemplateMapper;

	@Autowired
	private TbSpecificationOptionMapper specificationOptionMapper;

	@Autowired
	private RedisTemplate redisTemplate;
	
	/**
	 * 查询全部
	 */
	@Override
	public List<TbTypeTemplate> findAll() {
		return typeTemplateMapper.selectByExample(null);
	}

	/**
	 * 按分页查询
	 */
	@Override
	public PageResult findPage(int pageNum, int pageSize) {
		PageHelper.startPage(pageNum, pageSize);		
		Page<TbTypeTemplate> page=   (Page<TbTypeTemplate>) typeTemplateMapper.selectByExample(null);
		return new PageResult(page.getTotal(), page.getResult());
	}

	/**
	 * 增加
	 */
	@Override
	public void add(TbTypeTemplate typeTemplate) {
		typeTemplateMapper.insert(typeTemplate);		
	}

	
	/**
	 * 修改
	 */
	@Override
	public void update(TbTypeTemplate typeTemplate){
		typeTemplateMapper.updateByPrimaryKey(typeTemplate);
	}	
	
	/**
	 * 根据ID获取实体
	 * @param id
	 * @return
	 */
	@Override
	public TbTypeTemplate findOne(Long id){
		return typeTemplateMapper.selectByPrimaryKey(id);
	}

	/**
	 * 批量删除
	 */
	@Override
	public void delete(Long[] ids) {
		for(Long id:ids){
			typeTemplateMapper.deleteByPrimaryKey(id);
		}		
	}
	
	
	@Override
	public PageResult findPage(TbTypeTemplate typeTemplate, int pageNum, int pageSize) {
		PageHelper.startPage(pageNum, pageSize);
		
		TbTypeTemplateExample example=new TbTypeTemplateExample();
		Criteria criteria = example.createCriteria();
		
		if(typeTemplate!=null){			
						if(typeTemplate.getName()!=null && typeTemplate.getName().length()>0){
				criteria.andNameLike("%"+typeTemplate.getName()+"%");
			}			if(typeTemplate.getSpecIds()!=null && typeTemplate.getSpecIds().length()>0){
				criteria.andSpecIdsLike("%"+typeTemplate.getSpecIds()+"%");
			}			if(typeTemplate.getBrandIds()!=null && typeTemplate.getBrandIds().length()>0){
				criteria.andBrandIdsLike("%"+typeTemplate.getBrandIds()+"%");
			}			if(typeTemplate.getCustomAttributeItems()!=null && typeTemplate.getCustomAttributeItems().length()>0){
				criteria.andCustomAttributeItemsLike("%"+typeTemplate.getCustomAttributeItems()+"%");
			}	
		}

		Page<TbTypeTemplate> page= (Page<TbTypeTemplate>)typeTemplateMapper.selectByExample(example);

		//存入数据到缓存
		saveToRedis();

		return new PageResult(page.getTotal(), page.getResult());
	}

	/**
	 * 将数据存入缓存
	 */
	private void saveToRedis() {

		//获取模板数据
		List<TbTypeTemplate> all = findAll();
		//循环模板
		for (TbTypeTemplate tbTypeTemplate : all) {
			//存储品牌列表
			List<Map> brandList = JSON.parseArray(tbTypeTemplate.getBrandIds(), Map.class);
			redisTemplate.boundHashOps("brandList").put(tbTypeTemplate.getId(),brandList);

			//存储规格列表
			List<Map> specList = findSpecList(tbTypeTemplate.getId());
			redisTemplate.boundHashOps("specList").put(tbTypeTemplate.getId(),specList);

		}
	}

	/**
	 * 模板下拉框数据
	 */
	@Override
	public List<Map> selectOptionList() {
		return typeTemplateMapper.selectOptionList();
	}

	@Override
	public List<Map> findSpecList(Long id) {

		//根据id返回模板
		TbTypeTemplate tbTypeTemplate = typeTemplateMapper.selectByPrimaryKey(id);

		//(补充查询规格项的列表 补充)
		String specIds = tbTypeTemplate.getSpecIds();//[{"id":27,"text":"网络"},{"id":32,"text":"机身内存"}]
		List<Map> mapList = JSON.parseArray(specIds, Map.class);
		for (Map map : mapList) {//{"id":27,"text":"网络"}
			Long specId = new Long((Integer) map.get("id"));//27

			TbSpecificationOptionExample example = new TbSpecificationOptionExample();
			TbSpecificationOptionExample.Criteria criteria = example.createCriteria();
			criteria.andSpecIdEqualTo(specId);
			List<TbSpecificationOption> optionList = specificationOptionMapper.selectByExample(example);

			map.put("optionList",optionList);//{"id":27,"text":"网络","optionList":optionList}

		}
		return mapList;
	}

}
