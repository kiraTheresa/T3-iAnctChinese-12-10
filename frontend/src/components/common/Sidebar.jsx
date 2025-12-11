// src/components/common/Sidebar.js
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { t } from '../../utils/language';
import '../../styles/components/Sidebar.css';

const Sidebar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState(null);

  // 模拟项目数据
  const mockProjects = [
    { id: 1, name: '项目1', path: '/project/1' },
    { id: 2, name: '项目2', path: '/project/2' },
    { id: 3, name: '项目3', path: '/project/3' }
  ];

  // 导航菜单数据
  const navItems = [
    { name: 'dashboard', label: '仪表盘', path: '/dashboard' },
    { 
      name: 'projects', 
      label: '项目', 
      path: '/projects',
      hasChildren: true,
      children: mockProjects
    },
    { name: 'visualization', label: '可视化', path: '/visualization' },
    { name: 'profile', label: '个人资料', path: '/profile' },
    { name: 'settings', label: '设置', path: '/settings' }
  ];

  // 检查当前页面是否匹配导航项
  const isActive = (path) => {
    return location.pathname === path;
  };

  // 检查子菜单是否有激活项
  const hasActiveChild = (children) => {
    return children.some(child => location.pathname.startsWith(child.path));
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleSubMenu = (menuName) => {
    setExpandedMenu(expandedMenu === menuName ? null : menuName);
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* 侧边栏头部 */}
      <div className="sidebar-header">
        <button 
          type="button" 
          className="sidebar-toggle" 
          onClick={toggleSidebar}
          aria-label={isCollapsed ? '展开侧边栏' : '折叠侧边栏'}
        >
          <span className="toggle-icon">{isCollapsed ? '▶' : '◀'}</span>
        </button>
        {!isCollapsed && (
          <div className="sidebar-title">项目管理</div>
        )}
      </div>

      {/* 侧边栏导航 */}
      <nav className="sidebar-nav">
        <ul className="sidebar-nav-list">
          {navItems.map((item) => (
            <li 
              key={item.name} 
              className={`sidebar-nav-item ${isActive(item.path) || (item.hasChildren && hasActiveChild(item.children)) ? 'active' : ''}`}
            >
              <button 
                type="button" 
                className="sidebar-nav-link"
                onClick={() => {
                  if (item.hasChildren) {
                    toggleSubMenu(item.name);
                  } else {
                    handleNavigation(item.path);
                  }
                }}
              >
                {item.hasChildren ? (
                  <span className={`nav-item-arrow ${expandedMenu === item.name ? 'expanded' : ''}`}>
                    {expandedMenu === item.name ? '▼' : '▶'}
                  </span>
                ) : (
                  <span className="nav-item-arrow">•</span>
                )}
                <span className="nav-item-label">{item.label}</span>
              </button>
              
              {/* 子菜单 */}
              {item.hasChildren && expandedMenu === item.name && !isCollapsed && (
                <ul className="sidebar-subnav-list">
                  {item.children.map((child) => (
                    <li 
                      key={child.id} 
                      className={`sidebar-subnav-item ${isActive(child.path) ? 'active' : ''}`}
                    >
                      <button 
                        type="button" 
                        className="sidebar-subnav-link"
                        onClick={() => handleNavigation(child.path)}
                      >
                        <span className="nav-item-arrow">•</span>
                        <span className="nav-item-label">{child.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* 侧边栏底部 */}
      {user && !isCollapsed && (
        <div className="sidebar-footer">
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.username}</div>
            <div className="sidebar-user-role">{user.role || '用户'}</div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;