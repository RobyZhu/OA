// 全局变量
let isSidebarCollapsed = false;

// 文档加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化状态卡片
    initStatusCards();
    
    // 初始化表格相关功能
    initTableSelection();
    initSortTable();
    
    // 获取所有查看按钮
    const viewButtons = document.querySelectorAll('.btn-view');
    
    // 为每个查看按钮添加点击事件 - 仅改变颜色
    viewButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 移除所有其他按钮的active类
            viewButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            
            // 给当前点击的按钮添加active类
            this.classList.add('active');
        });
    });
    
    // 初始化筛选功能
    const filterSelect = document.querySelector('.filter-group select');
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            filterDocuments(this.value);
        });
    }
    
    // 初始化刷新按钮
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            this.querySelector('i').classList.add('fa-spin');
            
            // 模拟刷新延迟
            setTimeout(() => {
                this.querySelector('i').classList.remove('fa-spin');
                showToast('数据已刷新');
            }, 800);
        });
    }
    
    // 初始化批量操作
    initBatchActions();
    
    // 初始化分页功能
    initPagination();
    
    // 初始化表格视图切换
    initViewToggle();
    
    // 初始化排序状态
    initSort();
    
    // 初始化眼睛图标点击事件
    initViewButtons();
});

// 初始化状态卡片的交互效果
function initStatusCards() {
    const statusCards = document.querySelectorAll('.status-card');
    statusCards.forEach(card => {
        card.addEventListener('click', function() {
            statusCards.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// 初始化表格选择
function initTableSelection() {
    const selectAll = document.querySelector('.select-all');
    const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]');
    
    if (selectAll) {
        selectAll.addEventListener('change', function() {
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
            
            updateBatchActions();
        });
    }
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateSelectAllState();
            updateBatchActions();
        });
    });
}

// 更新全选框状态
function updateSelectAllState() {
    const selectAll = document.querySelector('.select-all');
    const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]');
    
    const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
    
    if (checkedCount === 0) {
        selectAll.checked = false;
        selectAll.indeterminate = false;
    } else if (checkedCount === checkboxes.length) {
        selectAll.checked = true;
        selectAll.indeterminate = false;
    } else {
        selectAll.checked = false;
        selectAll.indeterminate = true;
    }
}

// 更新批量操作按钮状态
function updateBatchActions() {
    const batchButtons = document.querySelectorAll('.batch-actions button');
    const checkedCount = document.querySelectorAll('tbody input[type="checkbox"]:checked').length;
    
    batchButtons.forEach(button => {
        if (checkedCount > 0) {
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
            button.disabled = false;
        } else {
            button.style.opacity = '0.5';
            button.style.cursor = 'not-allowed';
            button.disabled = true;
        }
    });
}

// 初始化排序功能
function initSortTable() {
    const sortHeaders = document.querySelectorAll('th[data-sort]');
    sortHeaders.forEach(header => {
        header.addEventListener('click', function() {
            // 排序逻辑
            const sortField = this.getAttribute('data-sort');
            const currentOrder = this.classList.contains('sort-asc') ? 'desc' : 'asc';
            
            // 重置所有排序头的样式
            sortHeaders.forEach(h => {
                h.classList.remove('sort-asc', 'sort-desc');
            });
            
            // 设置当前排序状态
            this.classList.add(`sort-${currentOrder}`);
            
            console.log(`排序: ${sortField} ${currentOrder}`);
            // 这里实际应用中需要调用排序函数
        });
    });
}

// 显示文档预览
function showDocPreview(docId) {
    // 查找或创建文档预览区域
    let previewArea = document.querySelector('.doc-preview');
    if (!previewArea) {
        previewArea = document.createElement('div');
        previewArea.className = 'doc-preview';
        document.querySelector('main').appendChild(previewArea);
    }
    
    // 更新预览内容
    previewArea.innerHTML = `
        <div class="preview-header">
            <h3 class="preview-title">文档预览: ${docId}</h3>
            <div class="preview-actions">
                <button class="btn-secondary"><i class="fas fa-print"></i> 打印</button>
                <button class="btn-secondary"><i class="fas fa-download"></i> 下载</button>
            </div>
        </div>
        <div class="preview-content">
            <p>这是文档 ${docId} 的预览内容。真实应用中，这里将显示该文档的详细信息。</p>
            <p>包括文档标题、编号、创建时间、内容摘要等信息。</p>
            <p>以及文档的审批流程、当前状态等。</p>
        </div>
    `;
    
    // 确保预览区域可见
    previewArea.style.display = 'block';
    
    // 滚动到预览区域
    previewArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 筛选文档
function filterDocuments(filterValue) {
    const rows = document.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
        const urgencyCell = row.querySelector('td:nth-child(9)');
        const isUrgent = urgencyCell.textContent.includes('急件') || urgencyCell.textContent.includes('特急件');
        
        if (filterValue === '全部') {
            row.style.display = '';
        } else if (filterValue === '紧急' && isUrgent) {
            row.style.display = '';
        } else if (filterValue === '普通' && !isUrgent) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
    
    showToast(`已筛选：${filterValue}公文`);
}

// 初始化批量操作
function initBatchActions() {
    const batchButtons = document.querySelectorAll('.batch-actions button');
    
    // 初始状态设置为禁用
    batchButtons.forEach(button => {
        button.style.opacity = '0.5';
        button.style.cursor = 'not-allowed';
        button.disabled = true;
        
        button.addEventListener('click', function() {
            if (this.disabled) return;
            
            const action = this.textContent.trim();
            const selectedCount = document.querySelectorAll('tbody input[type="checkbox"]:checked').length;
            
            if (action.includes('批量审批')) {
                showToast(`批量审批 ${selectedCount} 份文件`);
            } else if (action.includes('打印')) {
                showToast(`打印 ${selectedCount} 份文件`);
            } else if (action.includes('导出')) {
                showToast(`导出 ${selectedCount} 份文件`);
            }
        });
    });
}

// 初始化分页功能
function initPagination() {
    const pagination = document.querySelector('.pagination');
    const pages = pagination.querySelectorAll('a');
    
    pages.forEach(page => {
        page.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 移除当前激活状态
            pagination.querySelector('.active').classList.remove('active');
            
            // 设置新的激活页
            this.classList.add('active');
            
            // 在实际应用中，这里会加载对应页的数据
            console.log('切换到页码: ' + this.textContent);
            
            showToast('已加载第 ' + page.textContent + ' 页数据');
        });
    });
}

// 初始化表格视图切换
function initViewToggle() {
    const viewButtons = document.querySelectorAll('.view-toggle button');
    
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 移除所有按钮的激活状态
            viewButtons.forEach(btn => btn.classList.remove('active'));
            
            // 设置当前按钮为激活状态
            this.classList.add('active');
            
            const viewType = this.querySelector('i').classList.contains('fa-table') ? 'table' : 'list';
            switchView(viewType);
        });
    });
}

// 切换视图
function switchView(viewType) {
    const docList = document.querySelector('.doc-list');
    
    if (viewType === 'table') {
        docList.classList.remove('list-view');
        docList.classList.add('table-view');
        showToast('已切换到表格视图');
    } else {
        docList.classList.remove('table-view');
        docList.classList.add('list-view');
        showToast('已切换到列表视图');
    }
}

// 显示提示信息
function showToast(message) {
    // 检查是否已存在提示
    if (document.querySelector('.toast-message')) {
        return;
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.style.position = 'fixed';
    toast.style.bottom = '24px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    toast.style.color = '#fff';
    toast.style.padding = '10px 16px';
    toast.style.borderRadius = '4px';
    toast.style.zIndex = '1000';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // 3秒后自动消失
    setTimeout(function() {
        if (document.body.contains(toast)) {
            document.body.removeChild(toast);
        }
    }, 3000);
}

// 初始化表格排序功能
function initSort() {
    const headers = document.querySelectorAll('th[data-sort]');
    
    headers.forEach(header => {
        header.addEventListener('click', function() {
            const sortBy = this.getAttribute('data-sort');
            const isAsc = this.classList.contains('sort-asc');
            
            // 重置所有排序状态
            headers.forEach(h => {
                h.classList.remove('sort-asc', 'sort-desc');
            });
            
            // 设置当前排序状态
            if (isAsc) {
                this.classList.add('sort-desc');
            } else {
                this.classList.add('sort-asc');
            }
            
            // 根据排序状态排序表格
            sortTable(sortBy, !isAsc);
        });
    });
}

// 表格排序功能
function sortTable(column, asc) {
    const table = document.querySelector('.doc-list');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    // 排序行
    rows.sort((a, b) => {
        let valueA, valueB;
        
        // 根据列类型获取值
        if (column === 'date') {
            valueA = new Date(a.querySelector(`td[data-${column}]`).getAttribute(`data-${column}`));
            valueB = new Date(b.querySelector(`td[data-${column}]`).getAttribute(`data-${column}`));
        } else if (column === 'urgency') {
            const urgencyMap = {'普通': 0, '急件': 1, '特急件': 2};
            valueA = urgencyMap[a.querySelector(`td[data-${column}]`).textContent.trim()];
            valueB = urgencyMap[b.querySelector(`td[data-${column}]`).textContent.trim()];
        } else {
            valueA = a.querySelector(`td[data-${column}]`).textContent.trim();
            valueB = b.querySelector(`td[data-${column}]`).textContent.trim();
        }
        
        // 比较值
        if (valueA < valueB) return asc ? -1 : 1;
        if (valueA > valueB) return asc ? 1 : -1;
        return 0;
    });
    
    // 重建表格
    rows.forEach(row => {
        tbody.appendChild(row);
    });
}

// 初始化文档预览功能
function initViewButtons() {
    // 创建预览覆盖层和容器
    if (!document.querySelector('.preview-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'preview-overlay';
        document.body.appendChild(overlay);
        
        const preview = document.createElement('div');
        preview.className = 'doc-preview';
        preview.innerHTML = `
            <div class="preview-header">
                <div class="preview-title">文档预览</div>
                <div class="preview-close"><i class="fas fa-times"></i></div>
            </div>
            <div class="preview-content"></div>
            <div class="preview-footer">
                <button class="btn">关闭</button>
            </div>
        `;
        document.body.appendChild(preview);
        
        // 关闭预览的点击事件
        const closeElements = [
            overlay, 
            preview.querySelector('.preview-close'),
            preview.querySelector('.preview-footer .btn')
        ];
        
        closeElements.forEach(el => {
            el.addEventListener('click', function() {
                overlay.classList.remove('active');
                preview.classList.remove('active');
            });
        });
    }
    
    // 为所有查看按钮添加点击事件
    const viewButtons = document.querySelectorAll('.btn-view');
    const overlay = document.querySelector('.preview-overlay');
    const preview = document.querySelector('.doc-preview');
    const previewTitle = preview.querySelector('.preview-title');
    const previewContent = preview.querySelector('.preview-content');
    
    viewButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 获取文档信息
            const row = this.closest('tr');
            const title = row.querySelector('td[data-title]').textContent;
            const docId = row.getAttribute('data-id');
            const securityTag = row.querySelector('.security-tag') ? 
                row.querySelector('.security-tag').className.split(' ')[1] : 'security-normal';
                
            // 更新预览标题
            previewTitle.textContent = title;
            
            // 模拟加载文档内容
            previewContent.innerHTML = `
                <div class="loading" style="text-align: center; padding: 20px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: var(--primary-color);"></i>
                    <p style="margin-top: 10px;">正在加载文档内容...</p>
                </div>
            `;
            
            // 显示预览
            overlay.classList.add('active');
            preview.classList.add('active');
            
            // 模拟内容加载
            setTimeout(() => {
                // 根据安全等级设置预览内容样式
                let securityColor = 'var(--normal-security)';
                let securityText = '普通商密';
                let securityClass = 'normal';
                
                if (securityTag === 'security-important') {
                    securityColor = 'var(--important-security)';
                    securityText = '重要商密';
                    securityClass = 'important';
                } else if (securityTag === 'security-critical') {
                    securityColor = 'var(--critical-security)';
                    securityText = '核心商密';
                    securityClass = 'critical';
                }
                
                previewContent.innerHTML = `
                    <div class="document-meta" style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid var(--border-color);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <span style="font-weight: 500;">文档编号: ${docId || '未知'}</span>
                            <span class="security-badge" style="padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; background-color: rgba(${securityClass === 'normal' ? '16, 185, 129' : securityClass === 'important' ? '245, 158, 11' : '239, 68, 68'}, 0.1); color: ${securityColor}; border: 1px solid rgba(${securityClass === 'normal' ? '16, 185, 129' : securityClass === 'important' ? '245, 158, 11' : '239, 68, 68'}, 0.3);">
                                <i class="fas fa-${securityClass === 'critical' ? 'shield-alt' : 'lock'}"></i> ${securityText}
                            </span>
                        </div>
                    </div>
                    <div class="document-content">
                        <h3 style="margin-bottom: 15px;">${title}</h3>
                        <p style="margin-bottom: 10px; line-height: 1.6;">这是文档"${title}"的预览内容。根据系统规定，用户可以在此预览文档的基本信息和内容摘要。</p>
                        <p style="margin-bottom: 10px; line-height: 1.6;">如需查看完整内容或编辑文档，请点击下方的相应按钮进行操作。注意：不同权限的用户可操作的内容有所不同。</p>
                        
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
                            <h4 style="margin-bottom: 10px;">文档摘要</h4>
                            <p style="line-height: 1.6;">本文档主要讨论了关于项目进展的相关内容，包括当前完成情况、存在的问题以及下一步计划等。</p>
                        </div>
                        
                        <div style="margin-top: 20px;">
                            <h4 style="margin-bottom: 10px;">附件列表</h4>
                            <ul style="list-style: none; padding: 0;">
                                <li style="display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee;">
                                    <i class="fas fa-file-pdf" style="color: #f56565; margin-right: 10px;"></i>
                                    <span>项目进度报告.pdf</span>
                                </li>
                                <li style="display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee;">
                                    <i class="fas fa-file-excel" style="color: #48bb78; margin-right: 10px;"></i>
                                    <span>数据分析表.xlsx</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                `;
                
                // 添加底部按钮
                const footer = preview.querySelector('.preview-footer');
                footer.innerHTML = `
                    <button class="btn">下载</button>
                    <button class="btn">打印</button>
                    <button class="btn btn-primary">关闭</button>
                `;
                
                // 重新绑定关闭事件
                footer.querySelector('.btn-primary').addEventListener('click', function() {
                    overlay.classList.remove('active');
                    preview.classList.remove('active');
                });
            }, 1000);
        });
    });
} 