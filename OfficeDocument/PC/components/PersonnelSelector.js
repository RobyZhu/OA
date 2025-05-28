/**
 * 人员选择控件
 * 一个用于选择人员的通用组件，支持关键字搜索和组织机构树选择
 * @version 1.0.0
 */

class PersonnelSelector {
    /**
     * 创建一个人员选择控件
     * @param {Object} options - 配置选项
     * @param {string} options.containerId - 控件容器ID
     * @param {Array} options.selectedPersonnel - 已选人员数组
     * @param {Function} options.onSelectionChange - 选择变更回调函数
     * @param {string} options.placeholder - 输入框占位文本
     * @param {boolean} options.multiple - 是否支持多选
     * @param {boolean} options.required - 是否必填
     */
    constructor(options) {
        this.options = Object.assign({
            containerId: '',
            selectedPersonnel: [],
            onSelectionChange: null,
            placeholder: '请选择人员',
            multiple: true,
            required: false
        }, options);

        this.container = document.getElementById(this.options.containerId);
        if (!this.container) {
            console.error('人员选择控件: 未找到容器元素');
            return;
        }

        // 内部状态
        this.selectedPersonnel = [...this.options.selectedPersonnel];
        this.searchKeyword = '';
        this.searchResults = [];
        this.departments = [];
        this.personnel = [];
        this.currentDepartment = null;
        this.isDropdownVisible = false;
        this.isDialogVisible = false;
        this.tempSelectedIds = []; // 对话框临时选择状态

        // 初始化DOM结构
        this.initDOM();
        // 绑定事件
        this.bindEvents();
        // 加载初始数据
        this.loadInitialData();
        // 渲染已选人员
        this.renderSelectedPersonnel();
    }

    /**
     * 初始化DOM结构
     */
    initDOM() {
        this.container.classList.add('personnel-selector');
        
        // 创建主要的选择区域
        this.container.innerHTML = `
            <div class="personnel-input-area">
                <div class="selected-tags"></div>
                <input type="text" class="personnel-search-input"  placeholder="${this.options.placeholder}">
                <div class="personnel-dropdown" style="display: none;"></div>
            </div>
            <button class="personnel-selector-btn">
                <i class="fas fa-users"></i>
            </button>
        `;

        // 获取DOM元素引用
        this.inputArea = this.container.querySelector('.personnel-input-area');
        this.selectedTagsContainer = this.container.querySelector('.selected-tags');
        this.searchInput = this.container.querySelector('.personnel-search-input');
        this.dropdown = this.container.querySelector('.personnel-dropdown');
        this.selectorBtn = this.container.querySelector('.personnel-selector-btn');

        // 创建选择对话框
        this.createDialog();
    }

    /**
     * 创建选择对话框
     */
    createDialog() {
        const dialogHTML = `
            <div id="personnelSelectorDialog" class="personnel-dialog" style="display: none; z-index: 1100;">
                <div class="personnel-dialog-content">
                    <div class="personnel-dialog-header">
                        <h3>选择人员</h3>
                        <button class="personnel-dialog-close">&times;</button>
                    </div>
                    <div class="personnel-dialog-body">
                        <div class="personnel-dialog-left">
                            <div class="department-tree"></div>
                        </div>
                        <div class="personnel-dialog-right">
                            <div class="personnel-search-bar">
                                <input type="text" placeholder="搜索人员姓名" class="personnel-name-search">
                                <button class="personnel-search-btn">
                                    <i class="fas fa-search"></i>
                                </button>
                            </div>
                            <div class="personnel-list"></div>
                        </div>
                    </div>
                    <div class="personnel-dialog-footer">
                        <button class="personnel-dialog-cancel">取消</button>
                        <button class="personnel-dialog-confirm">确认</button>
                    </div>
                </div>
            </div>
        `;

        // 将对话框添加到body
        const dialogContainer = document.createElement('div');
        dialogContainer.innerHTML = dialogHTML;
        document.body.appendChild(dialogContainer.firstElementChild);

        // 获取对话框元素引用
        this.dialog = document.getElementById('personnelSelectorDialog');
        this.departmentTree = this.dialog.querySelector('.department-tree');
        this.personnelList = this.dialog.querySelector('.personnel-list');
        this.nameSearchInput = this.dialog.querySelector('.personnel-name-search');
        this.nameSearchBtn = this.dialog.querySelector('.personnel-search-btn');
        this.dialogCloseBtn = this.dialog.querySelector('.personnel-dialog-close');
        this.dialogCancelBtn = this.dialog.querySelector('.personnel-dialog-cancel');
        this.dialogConfirmBtn = this.dialog.querySelector('.personnel-dialog-confirm');
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 输入框事件
        this.searchInput.addEventListener('input', this.handleSearchInput.bind(this));
        this.searchInput.addEventListener('focus', this.handleInputFocus.bind(this));
        this.searchInput.addEventListener('blur', this.handleInputBlur.bind(this));
        this.searchInput.addEventListener('keydown', this.handleInputKeydown.bind(this));

        // 选择按钮事件
        this.selectorBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.openDialog();
        });

        // 对话框事件
        this.dialogCloseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.closeDialog();
        });
        
        this.dialogCancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.closeDialog();
        });
        
        this.dialogConfirmBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.confirmSelection();
        });
        
        this.nameSearchInput.addEventListener('input', this.handleNameSearch.bind(this));
        this.nameSearchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleNameSearch();
        });

        // 点击外部关闭下拉框
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target) && this.isDropdownVisible) {
                this.hideDropdown();
            }
        });

        // 点击对话框外部关闭对话框
        this.dialog.addEventListener('click', (e) => {
            if (e.target === this.dialog) {
                e.preventDefault();
                e.stopPropagation();
                this.closeDialog();
            }
        });
        
        // 阻止对话框内部点击事件冒泡
        this.dialog.querySelector('.personnel-dialog-content').addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    /**
     * 加载初始数据
     */
    loadInitialData() {
        // 模拟从服务器加载组织机构和人员数据
        // 实际应用中应替换为API调用
        this.departments = this.getMockDepartments();
        this.personnel = this.getMockPersonnel();
        
        // 渲染组织机构树
        this.renderDepartmentTree();
    }

    /**
     * 获取模拟的组织机构数据
     * @returns {Array} 组织机构数据
     */
    getMockDepartments() {
        return [
            { 
                id: 1, 
                name: '总公司', 
                parentId: null,
                children: [
                    { 
                        id: 2, 
                        name: '技术部', 
                        parentId: 1,
                        children: [
                            { id: 5, name: '开发组', parentId: 2, children: [] },
                            { id: 6, name: '测试组', parentId: 2, children: [] }
                        ] 
                    },
                    { 
                        id: 3, 
                        name: '市场部', 
                        parentId: 1,
                        children: [] 
                    },
                    { 
                        id: 4, 
                        name: '行政部', 
                        parentId: 1,
                        children: [] 
                    }
                ] 
            }
        ];
    }

    /**
     * 获取模拟的人员数据
     * @returns {Array} 人员数据
     */
    getMockPersonnel() {
        return [
            { id: 1, name: '张三', account: 'zhangsan', company: '总公司', department: '技术部/开发组' },
            { id: 2, name: '李四', account: 'lisi', company: '总公司', department: '技术部/开发组' },
            { id: 3, name: '王五', account: 'wangwu', company: '总公司', department: '技术部/测试组' },
            { id: 4, name: '赵六', account: 'zhaoliu', company: '总公司', department: '市场部' },
            { id: 5, name: '钱七', account: 'qianqi', company: '总公司', department: '市场部' },
            { id: 6, name: '孙八', account: 'sunba', company: '总公司', department: '行政部' },
            { id: 7, name: '周九', account: 'zhoujiu', company: '总公司', department: '行政部' },
            { id: 8, name: '吴十', account: 'wushi', company: '总公司', department: '行政部' }
        ];
    }

    /**
     * 处理搜索输入
     * @param {Event} e - 输入事件
     */
    handleSearchInput(e) {
        this.searchKeyword = e.target.value.trim();
        
        if (this.searchKeyword) {
            this.searchResults = this.searchPersonnel(this.searchKeyword);
            this.renderDropdown();
            this.showDropdown();
        } else {
            this.hideDropdown();
        }
    }

    /**
     * 搜索人员
     * @param {string} keyword - 搜索关键字
     * @returns {Array} 匹配的人员列表
     */
    searchPersonnel(keyword) {
        if (!keyword) return [];
        
        const lowerKeyword = keyword.toLowerCase();
        return this.personnel.filter(person => 
            person.name.toLowerCase().includes(lowerKeyword) || 
            person.account.toLowerCase().includes(lowerKeyword) ||
            person.department.toLowerCase().includes(lowerKeyword)
        );
    }

    /**
     * 渲染下拉列表
     */
    renderDropdown() {
        if (this.searchResults.length === 0) {
            this.dropdown.innerHTML = '<div class="no-results">无匹配人员</div>';
            return;
        }

        const html = this.searchResults.map(person => {
            const isSelected = this.isPersonSelected(person.id);
            return `
                <div class="dropdown-item${isSelected ? ' selected' : ''}" data-id="${person.id}">
                    <div class="person-info">
                        <span class="person-name">${person.name}</span>
                        <span class="person-details">(${person.account}, ${person.company}${person.department})</span>
                    </div>
                    ${isSelected ? '<i class="fas fa-check"></i>' : ''}
                </div>
            `;
        }).join('');

        this.dropdown.innerHTML = html;

        // 绑定点击事件
        const items = this.dropdown.querySelectorAll('.dropdown-item');
        items.forEach(item => {
            item.addEventListener('click', () => {
                const personId = parseInt(item.dataset.id);
                this.togglePersonSelection(personId);
            });
        });
    }

    /**
     * 显示下拉列表
     */
    showDropdown() {
        this.dropdown.style.display = 'block';
        this.isDropdownVisible = true;
    }

    /**
     * 隐藏下拉列表
     */
    hideDropdown() {
        this.dropdown.style.display = 'none';
        this.isDropdownVisible = false;
    }

    /**
     * 处理输入框获得焦点
     */
    handleInputFocus() {
        if (this.searchKeyword && this.searchResults.length > 0) {
            this.showDropdown();
        }
    }

    /**
     * 处理输入框失去焦点
     */
    handleInputBlur() {
        // 使用延时，确保点击下拉项的事件能够先触发
        setTimeout(() => {
            this.hideDropdown();
        }, 200);
    }

    /**
     * 处理输入框按键事件
     * @param {KeyboardEvent} e - 键盘事件
     */
    handleInputKeydown(e) {
        if (e.key === 'Escape') {
            this.hideDropdown();
        } else if (e.key === 'Enter' && this.isDropdownVisible) {
            e.preventDefault();
            const firstItem = this.dropdown.querySelector('.dropdown-item');
            if (firstItem) {
                const personId = parseInt(firstItem.dataset.id);
                this.togglePersonSelection(personId);
            }
        } else if (e.key === 'Backspace' && !this.searchKeyword && this.selectedPersonnel.length > 0) {
            // 当输入框为空时，按退格键删除最后一个已选人员
            this.removePersonnel(this.selectedPersonnel[this.selectedPersonnel.length - 1].id);
        }
    }

    /**
     * 切换人员选择状态
     * @param {number} personId - 人员ID
     */
    togglePersonSelection(personId) {
        const index = this.selectedPersonnel.findIndex(p => p.id === personId);
        
        if (index === -1) {
            // 添加人员
            const person = this.personnel.find(p => p.id === personId);
            if (person) {
                if (!this.options.multiple) {
                    // 单选模式，清除之前的选择
                    this.selectedPersonnel = [];
                }
                this.selectedPersonnel.push(person);
            }
        } else {
            // 移除人员
            this.selectedPersonnel.splice(index, 1);
        }
        
        // 更新显示
        this.renderSelectedPersonnel();
        this.hideDropdown();
        this.searchInput.value = '';
        this.searchKeyword = '';
        
        // 触发选择变更回调
        if (typeof this.options.onSelectionChange === 'function') {
            this.options.onSelectionChange(this.selectedPersonnel);
        }
    }

    /**
     * 检查人员是否已被选择
     * @param {number} personId - 人员ID
     * @returns {boolean} 是否已选择
     */
    isPersonSelected(personId) {
        return this.selectedPersonnel.some(p => p.id === personId);
    }

    /**
     * 渲染已选人员
     */
    renderSelectedPersonnel() {
        this.selectedTagsContainer.innerHTML = '';
        
        this.selectedPersonnel.forEach(person => {
            const tag = document.createElement('div');
            tag.className = 'personnel-tag';
            tag.innerHTML = `
                <span class="tag-name">${person.name}</span>
                <span class="tag-remove" data-id="${person.id}">&times;</span>
            `;
            this.selectedTagsContainer.appendChild(tag);
        });
        
        // 绑定删除按钮事件
        const removeButtons = this.selectedTagsContainer.querySelectorAll('.tag-remove');
        removeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const personId = parseInt(e.target.dataset.id);
                this.removePersonnel(personId);
            });
        });
        
        // 调整输入框宽度
        this.adjustInputWidth();
    }

    /**
     * 移除已选人员
     * @param {number} personId - 人员ID
     */
    removePersonnel(personId) {
        const index = this.selectedPersonnel.findIndex(p => p.id === personId);
        if (index !== -1) {
            this.selectedPersonnel.splice(index, 1);
            this.renderSelectedPersonnel();
            
            // 触发选择变更回调
            if (typeof this.options.onSelectionChange === 'function') {
                this.options.onSelectionChange(this.selectedPersonnel);
            }
        }
    }

    /**
     * 调整输入框宽度
     */
    adjustInputWidth() {
        if (this.selectedPersonnel.length > 0) {
            const tagsWidth = Array.from(this.selectedTagsContainer.children)
                .reduce((total, tag) => total + tag.offsetWidth + 4, 0); // 4px为tag间距
            
            const availableWidth = this.inputArea.offsetWidth - tagsWidth - 20; // 20px为padding和边距
            const minWidth = 50; // 最小宽度
            
            this.searchInput.style.width = `${Math.max(availableWidth, minWidth)}px`;
        } else {
            this.searchInput.style.width = '100%';
        }
    }

    /**
     * 打开选择对话框
     */
    openDialog() {
        this.dialog.style.display = 'flex';
        this.isDialogVisible = true;
        
        // 初始化临时选择状态
        this.tempSelectedIds = this.selectedPersonnel.map(p => p.id);
        
        // 渲染人员列表（默认显示全部人员）
        this.renderPersonnelList(this.personnel);
    }

    /**
     * 关闭选择对话框
     */
    closeDialog() {
        this.dialog.style.display = 'none';
        this.isDialogVisible = false;
        this.nameSearchInput.value = '';
    }

    /**
     * 确认选择
     */
    confirmSelection() {
        // 更新已选人员列表
        this.selectedPersonnel = this.personnel.filter(p => this.tempSelectedIds.includes(p.id));
        
        // 更新显示
        this.renderSelectedPersonnel();
        
        // 关闭对话框
        this.closeDialog();
        
        // 触发选择变更回调
        if (typeof this.options.onSelectionChange === 'function') {
            this.options.onSelectionChange(this.selectedPersonnel);
        }
    }

    /**
     * 渲染组织机构树
     */
    renderDepartmentTree() {
        const renderDepartmentNode = (department) => {
            const nodeHtml = `
                <div class="department-node" data-id="${department.id}">
                    <div class="department-name">
                        <i class="fas ${department.children.length > 0 ? 'fa-folder' : 'fa-folder-open'}"></i>
                        ${department.name}
                    </div>
                    ${department.children.length > 0 ? '<div class="department-children"></div>' : ''}
                </div>
            `;
            
            const node = document.createElement('div');
            node.innerHTML = nodeHtml;
            const nodeElement = node.firstElementChild;
            
            // 递归渲染子部门
            if (department.children.length > 0) {
                const childrenContainer = nodeElement.querySelector('.department-children');
                department.children.forEach(child => {
                    const childNode = renderDepartmentNode(child);
                    childrenContainer.appendChild(childNode);
                });
            }
            
            // 绑定点击事件
            const nameElement = nodeElement.querySelector('.department-name');
            nameElement.addEventListener('click', () => {
                // 高亮选中的部门
                const allNodes = this.departmentTree.querySelectorAll('.department-name');
                allNodes.forEach(n => n.classList.remove('selected'));
                nameElement.classList.add('selected');
                
                // 设置当前部门并显示人员
                this.currentDepartment = department;
                
                // 获取当前部门及其所有子部门的人员
                const departmentIds = this.getAllDepartmentIds(department);
                const departmentPersonnel = this.personnel.filter(p => {
                    // 简化版匹配，实际应用中应使用更精确的匹配逻辑
                    for (const deptId of departmentIds) {
                        const dept = this.findDepartmentById(deptId);
                        if (dept && p.department.includes(dept.name)) {
                            return true;
                        }
                    }
                    return false;
                });
                
                this.renderPersonnelList(departmentPersonnel);
            });
            
            return nodeElement;
        };
        
        this.departmentTree.innerHTML = '';
        this.departments.forEach(dept => {
            const node = renderDepartmentNode(dept);
            this.departmentTree.appendChild(node);
        });
    }

    /**
     * 获取部门及其所有子部门的ID
     * @param {Object} department - 部门对象
     * @returns {Array} 部门ID数组
     */
    getAllDepartmentIds(department) {
        const ids = [department.id];
        
        const addChildIds = (dept) => {
            dept.children.forEach(child => {
                ids.push(child.id);
                addChildIds(child);
            });
        };
        
        addChildIds(department);
        return ids;
    }

    /**
     * 通过ID查找部门
     * @param {number} id - 部门ID
     * @returns {Object|null} 部门对象或null
     */
    findDepartmentById(id) {
        const findDept = (departments) => {
            for (const dept of departments) {
                if (dept.id === id) {
                    return dept;
                }
                
                if (dept.children.length > 0) {
                    const found = findDept(dept.children);
                    if (found) {
                        return found;
                    }
                }
            }
            return null;
        };
        
        return findDept(this.departments);
    }

    /**
     * 处理姓名搜索
     */
    handleNameSearch() {
        const keyword = this.nameSearchInput.value.trim();
        
        if (keyword) {
            const filteredPersonnel = this.searchPersonnel(keyword);
            this.renderPersonnelList(filteredPersonnel);
        } else if (this.currentDepartment) {
            // 如果有选中的部门，显示该部门人员
            const departmentIds = this.getAllDepartmentIds(this.currentDepartment);
            const departmentPersonnel = this.personnel.filter(p => {
                for (const deptId of departmentIds) {
                    const dept = this.findDepartmentById(deptId);
                    if (dept && p.department.includes(dept.name)) {
                        return true;
                    }
                }
                return false;
            });
            this.renderPersonnelList(departmentPersonnel);
        } else {
            // 否则显示所有人员
            this.renderPersonnelList(this.personnel);
        }
    }

    /**
     * 渲染人员列表
     * @param {Array} personnelList - 人员列表
     */
    renderPersonnelList(personnelList) {
        if (personnelList.length === 0) {
            this.personnelList.innerHTML = '<div class="no-personnel">无匹配人员</div>';
            return;
        }
        
        const html = personnelList.map(person => {
            const isSelected = this.tempSelectedIds.includes(person.id);
            return `
                <div class="personnel-item${isSelected ? ' selected' : ''}" data-id="${person.id}">
                    <input type="checkbox" class="personnel-checkbox" ${isSelected ? 'checked' : ''}>
                    <div class="personnel-info">
                        <div class="personnel-name">${person.name}</div>
                        <div class="personnel-details">(${person.account}, ${person.company}${person.department})</div>
                    </div>
                </div>
            `;
        }).join('');
        
        this.personnelList.innerHTML = html;
        
        // 绑定点击事件
        const items = this.personnelList.querySelectorAll('.personnel-item');
        items.forEach(item => {
            item.addEventListener('click', () => {
                const personId = parseInt(item.dataset.id);
                const checkbox = item.querySelector('.personnel-checkbox');
                
                if (!this.options.multiple) {
                    // 单选模式
                    this.tempSelectedIds = [personId];
                    
                    // 更新所有复选框状态
                    const allCheckboxes = this.personnelList.querySelectorAll('.personnel-checkbox');
                    allCheckboxes.forEach(cb => {
                        cb.checked = false;
                        cb.closest('.personnel-item').classList.remove('selected');
                    });
                    
                    checkbox.checked = true;
                    item.classList.add('selected');
                } else {
                    // 多选模式
                    const index = this.tempSelectedIds.indexOf(personId);
                    
                    if (index === -1) {
                        this.tempSelectedIds.push(personId);
                        checkbox.checked = true;
                        item.classList.add('selected');
                    } else {
                        this.tempSelectedIds.splice(index, 1);
                        checkbox.checked = false;
                        item.classList.remove('selected');
                    }
                }
            });
        });
    }

    /**
     * 获取当前选择的人员
     * @returns {Array} 已选人员数组
     */
    getSelectedPersonnel() {
        return [...this.selectedPersonnel];
    }

    /**
     * 设置选定的人员
     * @param {Array} personnel - 人员数组
     */
    setSelectedPersonnel(personnel) {
        this.selectedPersonnel = [...personnel];
        this.renderSelectedPersonnel();
        
        // 触发选择变更回调
        if (typeof this.options.onSelectionChange === 'function') {
            this.options.onSelectionChange(this.selectedPersonnel);
        }
    }

    /**
     * 清空已选人员
     */
    clearSelection() {
        this.selectedPersonnel = [];
        this.renderSelectedPersonnel();
        
        // 触发选择变更回调
        if (typeof this.options.onSelectionChange === 'function') {
            this.options.onSelectionChange(this.selectedPersonnel);
        }
    }
}

// 导出组件
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PersonnelSelector;
} 