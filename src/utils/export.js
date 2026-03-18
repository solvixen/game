/**
 * 表格导出工具
 * 支持 Excel、CSV、PDF 格式导出
 */

import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

/**
 * 导出为 CSV 格式
 * @param {Array} data - 要导出的数据数组
 * @param {string} filename - 文件名（不含扩展名）
 * @param {Array} columns - 列配置 [{ label: '列名', prop: '字段名' }]
 */
export const exportToCSV = (data, filename = '导出数据', columns) => {
  try {
    if (!data || data.length === 0) {
      ElMessage.warning('没有数据可导出')
      return
    }

    // 如果没有指定列，使用数据的第一个对象的键作为列
    const headers = columns ? columns.map(col => col.label) : Object.keys(data[0])
    const props = columns ? columns.map(col => col.prop) : Object.keys(data[0])

    // 构建 CSV 内容
    const csvContent = [
      headers.join(','), // 表头
      ...data.map(row => 
        props.map(prop => {
          const value = row[prop]
          // 处理包含逗号或换行符的值
          if (value === null || value === undefined) return ''
          if (typeof value === 'string' && (value.includes(',') || value.includes('\n'))) {
            return `"${value}"`
          }
          return value
        }).join(',')
      )
    ].join('\n')

    // 创建 Blob 并下载
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.href = url
    link.download = `${filename}_${new Date().toLocaleDateString()}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    ElMessage.success('CSV导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

/**
 * 导出为 Excel 格式
 * @param {Array} data - 要导出的数据数组
 * @param {string} filename - 文件名
 * @param {Array} columns - 列配置
 * @param {string} sheetName - 工作表名称
 */
export const exportToExcel = (data, filename = '导出数据', columns, sheetName = 'Sheet1') => {
  try {
    if (!data || data.length === 0) {
      ElMessage.warning('没有数据可导出')
      return
    }

    // 准备数据
    const headers = columns ? columns.map(col => col.label) : Object.keys(data[0])
    const props = columns ? columns.map(col => col.prop) : Object.keys(data[0])

    // 构建工作表数据
    const worksheetData = [
      headers,
      ...data.map(row => props.map(prop => {
        const value = row[prop]
        if (value === null || value === undefined) return ''
        return value
      }))
    ]

    // 创建工作簿
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(worksheetData)

    // 设置列宽
    const colWidths = headers.map(() => ({ wch: 15 }))
    ws['!cols'] = colWidths

    // 将工作表添加到工作簿
    XLSX.utils.book_append_sheet(wb, ws, sheetName)

    // 导出文件
    XLSX.writeFile(wb, `${filename}_${new Date().toLocaleDateString()}.xlsx`)

    ElMessage.success('Excel导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

/**
 * 导出为 PDF 格式
 * @param {Array} data - 要导出的数据
 * @param {string} filename - 文件名
 * @param {Array} columns - 列配置
 * @param {string} title - 报表标题
 */
export const exportToPDF = (data, filename = '导出数据', columns, title = '数据报表') => {
  try {
    if (!data || data.length === 0) {
      ElMessage.warning('没有数据可导出')
      return
    }

    // 创建 PDF 文档
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })

    // 添加标题
    doc.setFontSize(16)
    doc.text(title, 14, 15)
    doc.setFontSize(10)
    doc.text(`生成时间：${new Date().toLocaleString()}`, 14, 22)

    // 准备表格数据
    const headers = columns ? columns.map(col => col.label) : Object.keys(data[0])
    const props = columns ? columns.map(col => col.prop) : Object.keys(data[0])
    
    const tableData = data.map(row => props.map(prop => {
      const value = row[prop]
      if (value === null || value === undefined) return ''
      return String(value)
    }))

    // 生成表格
    doc.autoTable({
      head: [headers],
      body: tableData,
      startY: 25,
      theme: 'striped',
      headStyles: {
        fillColor: [52, 152, 219],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        textColor: [50, 50, 50]
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { top: 30, left: 10, right: 10 },
      styles: {
        fontSize: 8,
        cellPadding: 2
      }
    })

    // 保存 PDF
    doc.save(`${filename}_${new Date().toLocaleDateString()}.pdf`)

    ElMessage.success('PDF导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

/**
 * 通用导出函数（根据格式自动选择）
 * @param {Array} data - 数据
 * @param {string} filename - 文件名
 * @param {Array} columns - 列配置
 * @param {string} format - 导出格式 (excel/csv/pdf)
 * @param {string} title - PDF标题
 */
export const exportData = (data, filename = '导出数据', columns, format = 'excel', title = '数据报表') => {
  switch (format.toLowerCase()) {
    case 'csv':
      exportToCSV(data, filename, columns)
      break
    case 'excel':
    case 'xlsx':
      exportToExcel(data, filename, columns)
      break
    case 'pdf':
      exportToPDF(data, filename, columns, title)
      break
    default:
      exportToExcel(data, filename, columns)
  }
}

/**
 * 格式化数据为导出准备
 * @param {Array} data - 原始数据
 * @param {Object} formatters - 字段格式化函数 { fieldName: (value) => formattedValue }
 */
export const formatForExport = (data, formatters = {}) => {
  return data.map(item => {
    const formatted = { ...item }
    Object.keys(formatters).forEach(key => {
      if (formatted[key] !== undefined) {
        formatted[key] = formatters[key](formatted[key])
      }
    })
    return formatted
  })
}