/**
 * 机构选择控件
 * 提供机构树展示、搜索过滤、单选/多选功能
 */
class OrganizationSelector {
    /**
     * 构造函数
     * @param {Object} options 配置选项
     * @param {string} options.containerId 容器元素ID
     * @param {Array} [options.selectedOrgs=[]] 初始已选机构
     * @param {Function} [options.onSelectionChange=null] 选择变更回调
     * @param {string} [options.placeholder='请选择机构'] 输入框占位文本
     * @param {boolean} [options.multiple=true] 是否支持多选
     * @param {boolean} [options.required=false] 是否必填
     */
    constructor(options) {
        this.options = Object.assign({
            containerId: '',
            selectedOrgs: [],
            onSelectionChange: null,
            placeholder: '请选择机构',
            multiple: true,
            required: false,
        }, options);

        this.container = document.getElementById(this.options.containerId);
        if (!this.container) {
            console.error(`找不到容器元素: #${this.options.containerId}`);
            return;
        }

        this.isOpen = false;
        this.organizations = [];
        // 默认情况下不选中任何数据
        this.selectedOrgs = [];
        this.expandedNodes = new Set();
        this.searchKeyword = '';
        this.filterResults = [];
        this.matchedNodeIds = new Set(); // 存储匹配的节点ID及其所有父节点ID

        this.render();
        this.bindEvents();
        this.fetchOrganizations();
    }

    /**
     * 渲染控件
     */
    render() {
        this.container.classList.add('org-selector');
        
        // 创建输入框包装器
        this.inputWrapper = document.createElement('div');
        this.inputWrapper.className = 'org-selector-input-wrapper';
        if (this.options.required) {
            this.inputWrapper.classList.add('required');
        }
        
        // 创建标签容器
        this.tagsContainer = document.createElement('div');
        this.tagsContainer.className = 'org-selector-tags';
        
        // 创建输入框
        this.input = document.createElement('input');
        this.input.className = 'org-selector-input';
        this.input.type = 'text';
        this.input.placeholder = this.options.placeholder;
        this.input.autocomplete = 'off';
        
        // 创建清除按钮
        this.clearBtn = document.createElement('span');
        this.clearBtn.className = 'org-selector-clear';
        this.clearBtn.innerHTML = '<i class="fas fa-times"></i>';
        
        // 创建下拉箭头
        this.arrow = document.createElement('span');
        this.arrow.className = 'org-selector-arrow';
        this.arrow.innerHTML = '<i class="fas fa-chevron-down"></i>';
        
        // 组装输入框区域
        this.inputWrapper.appendChild(this.tagsContainer);
        this.inputWrapper.appendChild(this.input);
        this.inputWrapper.appendChild(this.clearBtn);
        this.inputWrapper.appendChild(this.arrow);
        
        // 创建下拉树容器
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'org-selector-dropdown';
        
        // 创建搜索框
        this.searchContainer = document.createElement('div');
        this.searchContainer.className = 'org-selector-search';
        
        this.searchInput = document.createElement('input');
        this.searchInput.className = 'org-selector-search-input';
        this.searchInput.type = 'text';
        this.searchInput.placeholder = '搜索机构';
        
        this.searchIcon = document.createElement('span');
        this.searchIcon.className = 'org-selector-search-icon';
        this.searchIcon.innerHTML = '<i class="fas fa-search"></i>';
        
        this.searchContainer.appendChild(this.searchInput);
        this.searchContainer.appendChild(this.searchIcon);
        
        // 创建树容器
        this.treeContainer = document.createElement('div');
        this.treeContainer.className = 'org-selector-tree';
        
        // 创建底部操作区
        this.footer = document.createElement('div');
        this.footer.className = 'org-selector-footer';
        
        this.selectedCount = document.createElement('div');
        this.selectedCount.className = 'org-selector-selected-count';
        
        this.footerActions = document.createElement('div');
        this.footerActions.className = 'org-selector-footer-actions';
        
        this.cancelBtn = document.createElement('button');
        this.cancelBtn.className = 'org-selector-btn';
        this.cancelBtn.textContent = '取消';
        
        this.confirmBtn = document.createElement('button');
        this.confirmBtn.className = 'org-selector-btn org-selector-btn-primary';
        this.confirmBtn.textContent = '确定';
        
        this.footerActions.appendChild(this.cancelBtn);
        this.footerActions.appendChild(this.confirmBtn);
        
        this.footer.appendChild(this.selectedCount);
        this.footer.appendChild(this.footerActions);
        
        // 组装下拉菜单
        this.dropdown.appendChild(this.searchContainer);
        this.dropdown.appendChild(this.treeContainer);
        this.dropdown.appendChild(this.footer);
        
        // 将所有元素添加到容器中
        this.container.appendChild(this.inputWrapper);
        this.container.appendChild(this.dropdown);
        
        // 渲染已选项
        this.renderSelectedOrgs();
        this.updateSelectedCount();
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 输入框点击事件
        this.inputWrapper.addEventListener('click', (e) => {
            if (e.target === this.clearBtn || e.target.closest('.org-selector-clear')) {
                e.stopPropagation();
                this.clearSelection();
                return;
            }
            
            if (e.target.closest('.org-selector-tag-remove')) {
                return;
            }
            
            this.toggleDropdown();
        });
        
        // 输入框获得焦点事件
        // this.input.addEventListener('focus', () => {
        //     this.inputWrapper.classList.add('focused');
        //     if (!this.isOpen) {
        //         this.openDropdown();
        //     }
        // });
        
        // 输入框失去焦点事件
        // this.input.addEventListener('blur', () => {
        //     this.inputWrapper.classList.remove('focused');
        // });
        
        // 搜索框输入事件
        this.searchInput.addEventListener('input', () => {
            this.searchKeyword = this.searchInput.value.trim();
            this.filterOrganizations();
            this.renderTree();
        });
        
        // 取消按钮点击事件
        this.cancelBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeDropdown();
        });
        
        // 确定按钮点击事件
        this.confirmBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeDropdown();
        });
        
        // 点击外部关闭下拉菜单
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target) && this.isOpen) {
                this.closeDropdown();
            }
        });
        
        // 阻止下拉菜单中的点击事件冒泡
        this.dropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    /**
     * 切换下拉菜单的显示状态
     */
    toggleDropdown() {
        if (this.isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    /**
     * 打开下拉菜单
     */
    openDropdown() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        this.dropdown.classList.add('open');
        this.arrow.classList.add('open');
        this.searchInput.value = '';
        this.searchKeyword = '';
        this.matchedNodeIds.clear();
        this.filterOrganizations();
        this.renderTree();
        
        // 聚焦搜索框
        setTimeout(() => {
            this.searchInput.focus();
        }, 100);
    }

    /**
     * 关闭下拉菜单
     */
    closeDropdown() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        this.dropdown.classList.remove('open');
        this.arrow.classList.remove('open');
    }

    /**
     * 获取机构数据
     * 这里使用模拟数据，实际应用中应该从服务器获取
     */
    fetchOrganizations() {
        // 模拟异步获取数据
        setTimeout(() => {
            this.organizations = this.getMockOrganizations();
            this.renderTree();
        }, 500);
    }

    /**
     * 获取模拟机构数据
     * @returns {Array} 机构数据
     */
    getMockOrganizations() {
        return [
            {
                id: 1,
                name: '总公司',
                parentId: null,
                children: [
                    {
                        id: 2,
                        name: '北京分公司',
                        parentId: 1,
                        children: [
                            {
                                id: 5,
                                name: '研发部',
                                parentId: 2,
                                children: []
                            },
                            {
                                id: 6,
                                name: '市场部',
                                parentId: 2,
                                children: []
                            },
                            {
                                id: 7,
                                name: '运营部',
                                parentId: 2,
                                children: []
                            }
                        ]
                    },
                    {
                        id: 3,
                        name: '上海分公司',
                        parentId: 1,
                        children: [
                            {
                                id: 8,
                                name: '研发部',
                                parentId: 3,
                                children: []
                            },
                            {
                                id: 9,
                                name: '市场部',
                                parentId: 3,
                                children: []
                            }
                        ]
                    },
                    {
                        id: 4,
                        name: '广州分公司',
                        parentId: 1,
                        children: [
                            {
                                id: 10,
                                name: '研发部',
                                parentId: 4,
                                children: []
                            },
                            {
                                id: 11,
                                name: '市场部',
                                parentId: 4,
                                children: []
                            },
                            {
                                id: 12,
                                name: '财务部',
                                parentId: 4,
                                children: []
                            }
                        ]
                    }
                ]
            }
        ];
    }

    /**
     * 根据关键字过滤机构
     */
    filterOrganizations() {
        this.filterResults = [];
        this.matchedNodeIds.clear();
        
        if (!this.searchKeyword) {
            return;
        }
        
        this.searchOrganizations(this.organizations, this.searchKeyword);
        
        // 对于每个匹配的节点，添加其所有父节点到匹配集合中
        for (const org of this.filterResults) {
            this.collectParentIds(org);
        }
    }

    /**
     * 递归搜索机构
     * @param {Array} orgs 机构数组
     * @param {string} keyword 搜索关键字
     */
    searchOrganizations(orgs, keyword) {
        for (const org of orgs) {
            if (org.name.toLowerCase().includes(keyword.toLowerCase())) {
                this.filterResults.push(org);
                this.matchedNodeIds.add(org.id);
                this.expandParents(org);
            }
            
            if (org.children && org.children.length > 0) {
                this.searchOrganizations(org.children, keyword);
            }
        }
    }

    /**
     * 收集父节点ID
     * @param {Object} org 机构对象
     */
    collectParentIds(org) {
        if (org.parentId) {
            const parent = this.findOrgById(org.parentId);
            if (parent) {
                this.matchedNodeIds.add(parent.id);
                this.collectParentIds(parent);
            }
        }
    }

    /**
     * 展开父节点
     * @param {Object} org 机构对象
     */
    expandParents(org) {
        if (org.parentId) {
            const parent = this.findOrgById(org.parentId);
            if (parent) {
                this.expandedNodes.add(parent.id);
                this.expandParents(parent);
            }
        }
    }

    /**
     * 根据ID查找机构
     * @param {number} id 机构ID
     * @returns {Object|null} 机构对象
     */
    findOrgById(id) {
        const find = (orgs) => {
            for (const org of orgs) {
                if (org.id === id) {
                    return org;
                }
                
                if (org.children && org.children.length > 0) {
                    const found = find(org.children);
                    if (found) {
                        return found;
                    }
                }
            }
            
            return null;
        };
        
        return find(this.organizations);
    }

    /**
     * 渲染树结构
     */
    renderTree() {
        this.treeContainer.innerHTML = '';
        
        if (this.organizations.length === 0) {
            this.renderLoading();
            return;
        }
        
        if (this.searchKeyword && this.filterResults.length === 0) {
            this.renderEmpty();
            return;
        }
        
        for (const org of this.organizations) {
            const treeNode = this.renderTreeNode(org);
            this.treeContainer.appendChild(treeNode);
        }
    }

    /**
     * 渲染加载状态
     */
    renderLoading() {
        const loading = document.createElement('div');
        loading.className = 'org-selector-loading';
        loading.innerHTML = '<span class="org-selector-loading-icon"><i class="fas fa-spinner"></i></span> 加载中...';
        this.treeContainer.appendChild(loading);
    }

    /**
     * 渲染空状态
     */
    renderEmpty() {
        const empty = document.createElement('div');
        empty.className = 'org-selector-empty';
        empty.textContent = '没有找到匹配的机构';
        this.treeContainer.appendChild(empty);
    }

    /**
     * 渲染树节点
     * @param {Object} org 机构对象
     * @returns {HTMLElement} 树节点元素
     */
    renderTreeNode(org) {
        // 在搜索模式下，如果当前节点及其子节点都不在匹配结果中，则不渲染
        if (this.searchKeyword && !this.matchedNodeIds.has(org.id) && !this.hasMatchedChildren(org)) {
            return null;
        }
        
        const node = document.createElement('div');
        node.className = 'org-selector-tree-node';
        
        const nodeContent = document.createElement('div');
        nodeContent.className = 'org-selector-node-content';
        
        // 是否匹配搜索结果
        const isMatched = this.searchKeyword && this.filterResults.includes(org);
        
        // 是否有子节点
        const hasChildren = org.children && org.children.length > 0;
        
        // 是否展开
        const isExpanded = this.expandedNodes.has(org.id) || 
                          (this.searchKeyword && this.hasMatchedChildren(org));
        
        // 创建复选框
        const checkbox = document.createElement('span');
        checkbox.className = 'org-selector-node-checkbox';
        
        const isSelected = this.isOrgSelected(org.id);
        const isIndeterminate = !isSelected && this.hasSelectedChildren(org);
        
        if (isSelected) {
            checkbox.classList.add('checked');
        } else if (isIndeterminate) {
            checkbox.classList.add('indeterminate');
        }
        
        // 创建展开/折叠图标
        if (hasChildren) {
            const expandIcon = document.createElement('span');
            expandIcon.className = 'org-selector-node-expand';
            expandIcon.innerHTML = '<i class="fas fa-caret-right"></i>';
            
            if (isExpanded) {
                expandIcon.classList.add('expanded');
            }
            
            expandIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleNodeExpanded(org.id);
                this.renderTree();
            });
            
            nodeContent.appendChild(expandIcon);
        } else {
            const placeholder = document.createElement('span');
            placeholder.className = 'org-selector-node-expand';
            placeholder.innerHTML = '&nbsp;';
            nodeContent.appendChild(placeholder);
        }
        
        // 创建机构图标
        const icon = document.createElement('span');
        icon.className = 'org-selector-node-icon';
        icon.innerHTML = '<i class="fas fa-building"></i>';
        nodeContent.appendChild(icon);
        
        // 创建机构名称
        const text = document.createElement('span');
        text.className = 'org-selector-node-text';
        text.textContent = org.name;
        
        if (isMatched) {
            text.classList.add('matched');
        }
        
        nodeContent.appendChild(checkbox);
        nodeContent.appendChild(text);
        
        // 节点点击事件
        nodeContent.addEventListener('click', () => {
            this.toggleOrgSelection(org);
        });
        
        // 创建子节点容器
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'org-selector-tree-children';
        
        if (isExpanded) {
            childrenContainer.classList.add('expanded');
        }
        
        // 渲染子节点
        if (hasChildren) {
            let hasValidChildren = false;
            for (const child of org.children) {
                const childNode = this.renderTreeNode(child);
                if (childNode) {
                    childrenContainer.appendChild(childNode);
                    hasValidChildren = true;
                }
            }
            
            // 如果没有有效的子节点，并且当前节点不是搜索结果中的节点，则返回null
            if (!hasValidChildren && this.searchKeyword && !this.filterResults.includes(org)) {
                return null;
            }
        }
        
        node.appendChild(nodeContent);
        node.appendChild(childrenContainer);
        
        return node;
    }

    /**
     * 判断机构是否有匹配搜索结果的子机构
     * @param {Object} org 机构对象
     * @returns {boolean} 是否有匹配的子机构
     */
    hasMatchedChildren(org) {
        if (!org.children || org.children.length === 0) {
            return false;
        }
        
        for (const child of org.children) {
            if (this.filterResults.includes(child) || this.hasMatchedChildren(child)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * 切换节点展开状态
     * @param {number} orgId 机构ID
     */
    toggleNodeExpanded(orgId) {
        if (this.expandedNodes.has(orgId)) {
            this.expandedNodes.delete(orgId);
        } else {
            this.expandedNodes.add(orgId);
        }
    }

    /**
     * 切换机构选择状态
     * @param {Object} org 机构对象
     */
    toggleOrgSelection(org) {
        const isSelected = this.isOrgSelected(org.id);
        
        if (isSelected) {
            // 取消选择
            this.removeOrgSelection(org);
        } else {
            // 选择
            if (!this.options.multiple) {
                // 单选模式，先清空所有选择
                this.selectedOrgs = [];
            }
            
            this.addOrgSelection(org);
        }
        
        // 渲染已选项
        this.renderSelectedOrgs();
        // 更新底部选择计数
        this.updateSelectedCount();
        // 重新渲染树
        this.renderTree();
        // 触发回调
        if (typeof this.options.onSelectionChange === 'function') {
            this.options.onSelectionChange([...this.selectedOrgs]);
        }
    }

    /**
     * 添加机构选择
     * @param {Object} org 机构对象
     */
    addOrgSelection(org) {
        if (!this.isOrgSelected(org.id)) {
            this.selectedOrgs.push(org);
        }
    }

    /**
     * 移除机构选择
     * @param {Object} org 机构对象
     */
    removeOrgSelection(org) {
        const index = this.selectedOrgs.findIndex(item => item.id === org.id);
        if (index !== -1) {
            this.selectedOrgs.splice(index, 1);
        }
    }

    /**
     * 判断机构是否被选择
     * @param {number} orgId 机构ID
     * @returns {boolean} 是否被选择
     */
    isOrgSelected(orgId) {
        return this.selectedOrgs.some(org => org.id === orgId);
    }

    /**
     * 判断机构是否有被选择的子机构
     * @param {Object} org 机构对象
     * @returns {boolean} 是否有被选择的子机构
     */
    hasSelectedChildren(org) {
        if (!org.children || org.children.length === 0) {
            return false;
        }
        
        for (const child of org.children) {
            if (this.isOrgSelected(child.id) || this.hasSelectedChildren(child)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * 判断机构是否是指定ID机构的子机构
     * @param {Object} org 机构对象
     * @param {number} parentId 父机构ID
     * @returns {boolean} 是否是子机构
     */
    isChildOf(org, parentId) {
        if (org.parentId === parentId) {
            return true;
        }
        
        const parent = this.findOrgById(org.parentId);
        if (parent) {
            return this.isChildOf(parent, parentId);
        }
        
        return false;
    }

    /**
     * 渲染已选机构
     */
    renderSelectedOrgs() {
        this.tagsContainer.innerHTML = '';
        
        for (const org of this.selectedOrgs) {
            const tag = document.createElement('div');
            tag.className = 'org-selector-tag';
            
            const text = document.createElement('span');
            text.className = 'org-selector-tag-text';
            text.textContent = org.name;
            
            const remove = document.createElement('span');
            remove.className = 'org-selector-tag-remove';
            remove.innerHTML = '<i class="fas fa-times"></i>';
            
            remove.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeOrgSelection(org);
                this.renderSelectedOrgs();
                this.updateSelectedCount();
                this.renderTree();
                
                if (typeof this.options.onSelectionChange === 'function') {
                    this.options.onSelectionChange([...this.selectedOrgs]);
                }
            });
            
            tag.appendChild(text);
            tag.appendChild(remove);
            this.tagsContainer.appendChild(tag);
        }
    }

    /**
     * 更新底部选择计数
     */
    updateSelectedCount() {
        this.selectedCount.textContent = `已选择 ${this.selectedOrgs.length} 项`;
    }

    /**
     * 清空选择
     */
    clearSelection() {
        this.selectedOrgs = [];
        this.renderSelectedOrgs();
        this.updateSelectedCount();
        this.renderTree();
        
        if (typeof this.options.onSelectionChange === 'function') {
            this.options.onSelectionChange([]);
        }
    }

    /**
     * 获取已选机构
     * @returns {Array} 已选机构数组
     */
    getSelectedOrgs() {
        return [...this.selectedOrgs];
    }

    /**
     * 设置已选机构
     * @param {Array} orgs 机构数组
     */
    setSelectedOrgs(orgs) {
        this.selectedOrgs = orgs.map(org => {
            const found = this.findOrgById(org.id);
            return found || org;
        });
        
        this.renderSelectedOrgs();
        this.updateSelectedCount();
        this.renderTree();
        
        if (typeof this.options.onSelectionChange === 'function') {
            this.options.onSelectionChange([...this.selectedOrgs]);
        }
    }
}
