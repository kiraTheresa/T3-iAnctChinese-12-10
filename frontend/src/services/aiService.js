// src/services/aiService.js
// AI 服务

import api from './api';

export const aiService = {
  /**
   * 古文解析
   * @param {string} text - 要解析的文本
   * @param {string} model - 模型名称
   * @returns {Promise<string>} 解析结果
   */
  async analyzeClassicalText(text, model = 'deepseek-chat') {
    try {
      const result = await api.ai.analyzeText(text, model);
      return result.result || '';
    } catch (error) {
      console.error('古文解析失败:', error);
      throw new Error(`解析失败: ${error.message}`);
    }
  },

  /**
   * 古文答疑
   * @param {string} text - 古文文本
   * @param {string} question - 问题
   * @param {string} model - 模型名称
   * @returns {Promise<string>} 答案
   */
  async askQuestion(text, question, model = 'deepseek-chat') {
    try {
      const result = await api.ai.askQuestion(text, question, model);
      return result.result || '';
    } catch (error) {
      console.error('古文答疑失败:', error);
      throw new Error(`答疑失败: ${error.message}`);
    }
  },

  /**
   * 自动实体标注
   * @param {string} text - 要标注的文本
   * @param {string} model - 使用的模型
   * @returns {Promise<Array>} 标注结果
   */
  async autoAnnotateEntities(text, model = 'xunzi-qwen2') {
    try {
      console.log('发送自动标注请求，文本长度:', text.length, '模型:', model);
      
      // 对于长文本，进行分块处理
      if (text.length > 500) {
        console.log('文本过长，启用分块处理');
        return await this.autoAnnotateLongText(text, model);
      }
      
      const result = await api.ai.autoAnnotate(text, model);
      console.log('AI 返回结果:', result);
      
      if (!result || !result.annotations) {
        throw new Error('AI返回的数据格式不正确');
      }
      
      return result.annotations;
    } catch (error) {
      console.error('自动标注失败:', error);
      
      // 提供更友好的错误信息
      if (error.message.includes('格式无法解析')) {
        throw new Error('AI服务返回的数据格式有误，可能是文本过长导致的。请尝试使用较短的文本，或联系系统管理员。');
      } else if (error.message.includes('timed out') || error.message.includes('timeout')) {
        throw new Error('AI服务响应超时，可能是文本过长或服务器繁忙。请稍后再试或缩短文本长度。');
      } else if (error.message.includes('network') || error.message.includes('Network')) {
        throw new Error('网络连接错误，请检查网络连接后重试。');
      }
      
      throw new Error(`自动标注失败: ${error.message}`);
    }
  },

  /**
   * 长文本自动标注（分块处理）- 修复版本
   * @param {string} text - 长文本
   * @param {string} model - 模型名称
   * @param {number} chunkSize - 分块大小，默认500字符
   * @param {number} overlap - 重叠字符数，默认100字符
   * @returns {Promise<Array>} 标注结果
   */
  async autoAnnotateLongText(text, model = 'xunzi-qwen2', chunkSize = 500, overlap = 100) {
    try {
      console.log(`开始分块处理长文本，总长度: ${text.length}, 分块大小: ${chunkSize}, 重叠: ${overlap}`);
      
      const chunks = [];
      let start = 0;
      
      // 修复分块逻辑 - 确保分块大小合理
      while (start < text.length) {
        let end = Math.min(start + chunkSize, text.length);
        
        // 如果是最后一块，直接使用文本末尾
        if (end === text.length) {
          const chunk = text.slice(start, end);
          if (chunk.trim().length > 0) {
            chunks.push({
              text: chunk,
              start: start,
              end: end,
              index: chunks.length
            });
            console.log(`最后分块 ${chunks.length}: 位置 ${start}-${end}, 长度: ${chunk.length}`);
          }
          break;
        }
        
        // 尝试在句子边界处截断
        let boundaryFound = false;
        const boundaryChars = ['。', '.', '！', '!', '？', '?', '；', ';', '，', ',', ' ', '\n', '\r'];
        
        for (const char of boundaryChars) {
          const lastIndex = text.lastIndexOf(char, end - 1);
          if (lastIndex > start + (chunkSize * 0.5)) {
            end = lastIndex + char.length;
            boundaryFound = true;
            break;
          }
        }
        
        // 如果没找到合适边界，尝试找汉字边界
        if (!boundaryFound && end < text.length) {
          // 避免在汉字中间截断
          const charCode = text.charCodeAt(end);
          if (charCode >= 0x4E00 && charCode <= 0x9FFF) {
            // 如果是汉字，往前找一个非汉字或标点
            for (let i = end - 1; i > start + (chunkSize * 0.7); i--) {
              const prevChar = text.charAt(i);
              if (!prevChar.match(/[\u4e00-\u9fff]/)) {
                end = i + 1;
                boundaryFound = true;
                break;
              }
            }
          }
        }
        
        // 确保分块不会太小（最小20字符）
        const minChunkSize = 20;
        if (end - start < minChunkSize && end < text.length) {
          // 如果分块太小，向后扩展直到达到最小大小
          end = Math.min(start + minChunkSize, text.length);
        }
        
        const chunk = text.slice(start, end);
        
        // 跳过过小的分块
        if (chunk.trim().length >= minChunkSize) {
          chunks.push({
            text: chunk,
            start: start,
            end: end,
            index: chunks.length
          });
          
          console.log(`分块 ${chunks.length}: 位置 ${start}-${end}, 长度: ${chunk.length}`);
        }
        
        // 关键修复：计算下一个分块的开始位置
        // 使用 end - overlap，但确保不会倒退
        const nextStart = Math.max(start + 1, end - overlap);
        
        // 确保有向前进展
        if (nextStart <= start) {
          console.warn(`分块 ${chunks.length} 无法前进，强制前进到 ${end}`);
          start = end;
        } else {
          start = nextStart;
        }
        
        // 如果已经到达文本末尾，退出循环
        if (start >= text.length) {
          break;
        }
        
        // 安全限制：最多分200个块
        if (chunks.length >= 200) {
          console.warn('已达到最大分块数200，停止分块');
          break;
        }
      }
      
      console.log(`共分成 ${chunks.length} 个块`);
      
      if (chunks.length === 0) {
        console.log('没有创建任何分块，处理前500字符');
        const shortText = text.substring(0, Math.min(500, text.length));
        const result = await api.ai.autoAnnotate(shortText, model);
        return result?.annotations || [];
      }
      
      // 串行处理
      let allAnnotations = [];
      let processedCount = 0;
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        processedCount++;
        console.log(`处理块 ${i + 1}/${chunks.length}: 位置 ${chunk.start}-${chunk.end}, 长度: ${chunk.text.length}`);
        
        try {
          // 添加延迟
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
          const result = await api.ai.autoAnnotate(chunk.text, model);
          
          if (result && result.annotations) {
            const adjustedAnnotations = result.annotations.map(ann => ({
              ...ann,
              start: ann.start + chunk.start,
              end: ann.end + chunk.start
            }));
            
            allAnnotations = [...allAnnotations, ...adjustedAnnotations];
            console.log(`块 ${i + 1} 获得 ${adjustedAnnotations.length} 个标注`);
          }
        } catch (error) {
          console.error(`处理块 ${i + 1} 失败:`, error.message);
        }
        
        // 进度反馈
        if ((i + 1) % 10 === 0) {
          console.log(`已处理 ${i + 1}/${chunks.length} 个块`);
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      // 去重处理
      const uniqueAnnotations = this.removeDuplicateAnnotations(allAnnotations);
      console.log(`分块处理完成，共获得 ${allAnnotations.length} 个标注，去重后 ${uniqueAnnotations.length} 个`);
      
      return uniqueAnnotations;
      
    } catch (error) {
      console.error('长文本自动标注失败:', error);
      throw new Error(`长文本标注失败: ${error.message}`);
    }
  },

  /**
   * 安全版本的自动实体标注
   * @param {string} text - 要标注的文本
   * @param {string} model - 使用的模型
   * @param {function} onProgress - 进度回调函数
   * @param {AbortSignal} signal - 取消信号
   * @returns {Promise<Array>} 标注结果
   */
  async autoAnnotateEntitiesSafe(text, model = 'xunzi-qwen2', onProgress = null, signal = null) {
    try {
      console.log('安全版本自动标注，文本长度:', text.length, '模型:', model);
      
      // 检查取消信号
      if (signal?.aborted) {
        throw new DOMException('请求已取消', 'AbortError');
      }
      
      // 对于短文本，直接调用原方法
      if (text.length <= 500) {
        if (onProgress) onProgress(1, 1);
        return await this.autoAnnotateEntities(text, model);
      }
      
      // 使用小分块处理（500字符）
      const result = await this.autoAnnotateLongText(text, model, 500, 100);
      
      if (onProgress) onProgress(1, 1);
      return result;
      
    } catch (error) {
      console.error('安全自动标注失败:', error);
      throw error;
    }
  },

  /**
   * 移除重复的标注
   * @param {Array} annotations - 标注数组
   * @returns {Array} 去重后的标注数组
   */
  removeDuplicateAnnotations(annotations) {
    const uniqueMap = new Map();
    
    annotations.forEach(ann => {
      const key = `${ann.start}-${ann.end}-${ann.label}-${ann.text}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, ann);
      }
    });
    
    return Array.from(uniqueMap.values());
  },

  /**
   * 获取可用模型列表
   * @returns {Array} 模型列表
   */
  getAvailableModels() {
    return [
      {
        id: 'xunzi-qwen2',
        name: '荀子古汉语大模型',
        description: '云端部署的荀子大模型，专为古汉语设计，古文理解更准确',
        recommended: true
      },
      {
        id: 'deepseek-chat',
        name: 'DeepSeek-V3',
        description: '最新V3模型，速度快，效果好'
      },
      {
        id: 'deepseek-reasoner',
        name: 'DeepSeek-R1',
        description: '推理模型，深度分析，速度较慢'
      }
    ];
  },

  /**
   * 自动关系标注
   * @param {string} text - 要标注的文本
   * @param {Array} entityAnnotations - 实体标注列表
   * @param {string} model - 使用的模型
   * @returns {Promise<Array>} 关系标注结果
   */
  async autoAnnotateRelations(text, entityAnnotations, model = 'xunzi-qwen2') {
    try {
      console.log('发送自动关系标注请求，实体数量:', entityAnnotations.length, '模型:', model);
      
      // 如果实体数量少于2，无法生成关系
      if (entityAnnotations.length < 2) {
        return [];
      }
      
      // 准备实体信息，用于AI提示词
      const entitiesInfo = entityAnnotations.map((ann, index) => {
        return `${index + 1}. [${ann.label || '其他'}] "${ann.text || ''}" (位置: ${ann.start}-${ann.end})`;
      }).join('\n');
      
      // 设计提示词，让AI生成实体间的关系
      const prompt = `请根据输入文本与已识别实体列表，抽取文本中明确出现的实体关系，并严格按照指定 JSON 结构输出。 
 
 【输入数据】 
 1. 文本内容（可能为古汉语）： 
 ${text.substring(0, 2000)}...
 
 2. 已识别的实体列表（JSON 数组，每项包含实体名与类型）： 
 ${entitiesInfo}
 
 注意：实体的索引基于此列表，从 0 开始计数。 
 
 【任务要求】 
 请依据文本内容，判断实体之间在文本中是否存在明确的关系，并输出关系列表。仅在文本具有清晰的关系描述时才输出关系，不得推测或补全文本未说明的内容。 
 
 【关系判断规则】 
 1. 关系必须由文本明确提供，不得依赖常识、背景知识或推断。 
 2. 关系是有方向性的。如果文本表达 A 是 B 的父，则方向为从 A 指向 B。 
 3. 只输出实体之间的直接关系。模糊、隐含或间接关系不得输出。 
 4. 若文本没有给出任何关系，则返回空数组。 
 
 【古汉语关系提示】 
 在古汉语中，以下词语常用于表关系（仅作识别辅助，不代表必须存在关系）： 
 - 血缘：父、子、兄、弟、妻、臣、君、师、生、徒 
 - 官职或上下级：属、奉、命、使、遣、从 
 - 交情：与、友、告、谓 
 - 其他指向性词语：之、其、乃、为、以 
  
 【输出格式要求】 
 1. 只能返回严格的 JSON 格式，不能包含解释、注释或多余文字。 
 2. JSON 结构如下： 
 
 { 
   "relations": [ 
     { 
       "entity1Index": 0, 
       "entity2Index": 1, 
       "relationName": "父子关系" 
     } 
   ] 
 } 
 
 要求： 
 - entity1Index 和 entity2Index 必须为有效索引。 
 - 不允许出现 entity1Index == entity2Index。 
 - 不允许关系重复。 
 - relationName 必须为简洁的中文短语（如“父子关系”“朋友关系”“臣属关系”）。 
 
 【最终输出】 
 请仅输出 JSON，不要添加任何说明。 
`;
      
      // 调用AI服务
      const result = await api.ai.askQuestion(text, prompt, model);
      console.log('AI关系标注返回结果:', result);
      
      // 提取JSON结果
      let relationsResult;
      try {
        // 清理可能的markdown代码块
        const cleanedResult = result.result.replace(/```json\n|\n```|```/g, '').trim();
        relationsResult = JSON.parse(cleanedResult);
      } catch (jsonError) {
        console.error('AI关系标注JSON解析失败:', jsonError);
        console.log('AI返回的原始内容:', result.result);
        return [];
      }
      
      // 验证结果格式
      if (!relationsResult.relations || !Array.isArray(relationsResult.relations)) {
        console.error('AI关系标注结果格式不正确:', relationsResult);
        return [];
      }
      
      // 处理结果，确保索引有效
      const validRelations = relationsResult.relations.filter(rel => {
        const isValid = rel.entity1Index >= 0 && 
                       rel.entity1Index < entityAnnotations.length && 
                       rel.entity2Index >= 0 && 
                       rel.entity2Index < entityAnnotations.length &&
                       rel.entity1Index !== rel.entity2Index &&
                       rel.relationName && rel.relationName.trim();
        if (!isValid) {
          console.warn('无效的关系:', rel);
        }
        return isValid;
      });
      
      // 去重处理
      const uniqueRelations = this.removeDuplicateRelations(validRelations);
      console.log(`AI关系标注完成，共生成 ${validRelations.length} 个关系，去重后 ${uniqueRelations.length} 个`);
      
      return uniqueRelations;
      
    } catch (error) {
      console.error('自动关系标注失败:', error);
      throw new Error(`关系标注失败: ${error.message}`);
    }
  },
  
  /**
   * 移除重复的关系
   * @param {Array} relations - 关系数组
   * @returns {Array} 去重后的关系数组
   */
  removeDuplicateRelations(relations) {
    const uniqueMap = new Map();
    
    relations.forEach(rel => {
      // 关系是有方向的，所以 (A,B,关系) 和 (B,A,关系) 是不同的关系
      const key = `${rel.entity1Index}-${rel.entity2Index}-${rel.relationName}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, rel);
      }
    });
    
    return Array.from(uniqueMap.values());
  }
};