/*
 * @Author: hui.chenn
 * @Description: 
 * @Date: 2026-03-25 19:54:48
 * @LastEditTime: 2026-03-25 19:55:00
 * @LastEditors: hui.chenn
 */
/**
 * 系统和模块静态数据配置
 */

export const systemModuleData = {
  // 系统列表
  systems: [
    {
      code: 'GOMS_DOMESTIC',
      name: 'GOMS-国内'
    },
    {
      code: 'GOMS_INTERNATIONAL',
      name: 'GOMS-国际'
    },
    {
      code: 'DESKTOP_OPS',
      name: '桌面运维'
    }
  ],

  // 模块列表（按系统编码分组）
  modules: {
    'GOMS_DOMESTIC': [
      { code: 'DOMESTIC_FORECAST', name: '国内预测' },
      { code: 'DOMESTIC_TRANSFER', name: '国内调拨' },
      { code: 'EC_ORDER_MGMT', name: '电商订单管理' },
      { code: 'TOB_ORDER', name: 'TOB订单' },
      { code: 'PRICE_MGMT', name: '价格管理' },
      { code: 'SHIPMENT_LOGISTICS', name: '发货物流管理' },
      { code: 'INTERNAL_TRADE_ORDER', name: '内部交易订单' },
      { code: 'INBOUND_MGMT', name: '入库管理' },
      { code: 'SAMPLE_MGMT', name: '样机管理' },
      { code: 'WAREHOUSE_INVENTORY', name: '仓储库存管理' },
      { code: 'PROMO_GIFT_MGMT', name: '活动赠品管理' },
      { code: 'MONTHLY_ORDER_MGMT', name: '月结推单管理' },
      { code: 'MASTER_DATA_MGMT', name: '主数据管理' },
      { code: 'APPROVAL_FLOW_MGMT', name: '审批流管理' }
    ],
    'GOMS_INTERNATIONAL': [
      { code: 'INTL_FORECAST_SHIPMENT', name: '预测+要货' },
      { code: 'INTL_MASTER_DATA', name: '主数据管理' },
      { code: 'VOUCHER_MGMT', name: '凭证管理' },
      { code: 'PRODUCT_MGMT', name: '产品管理' },
      { code: 'FIRST_LEG_SHIPMENT', name: '头程出运' },
      { code: 'B2B_ORDER', name: '2B订单' },
      { code: 'B2C_ORDER', name: '2C订单' },
      { code: 'SAMPLE_ORDER', name: '样机订单' },
      { code: 'INVENTORY_MGMT', name: '库存管理' },
      { code: 'BILL_ANALYSIS', name: '账单解析' }
    ],
    'DESKTOP_OPS': [
      { code: 'PERMISSION_ASSISTANT', name: '智能权限助手' },
      { code: 'OPS_ASSISTANT', name: '智能运维助手' },
      { code: 'WEAK_CURRENT', name: '弱电' }
    ]
  }
}

/**
 * 获取系统列表
 * @returns {Array} 系统列表
 */
export const getSystemList = () => {
  return systemModuleData.systems
}

/**
 * 根据系统编码获取模块列表
 * @param {string} systemCode - 系统编码
 * @returns {Array} 模块列表
 */
export const getModuleListBySystem = (systemCode) => {
  return systemModuleData.modules[systemCode] || []
}
