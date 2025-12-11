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

  // 导航菜单数据
  const navItems = [
    { name: 'dashboard', label: t('dashboard'), path: '/dashboard' },
    { name: 'projects', label: t('projects'), path: '/dashboard' },
    { name: 'visualization', label: t('visualization'), path: '/visualization' },
    { name: 'profile', label: t('profile'), path: '/profile' },
    { name: 'settings', label: t('settings'), path: '/settings' }
  ];

  // 检查当前页面是否匹配导航项
  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* 侧边栏头部 */}
      <div className="sidebar-header">
        <button 
          type="button" 
          className="sidebar-toggle" 
          onClick={toggleSidebar}
          aria-label={isCollapsed ? t('expand_sidebar') : t('collapse_sidebar')}
        >
          <i data-feather={isCollapsed ? 'chevron-right' : 'chevron-left'}></i>
        </button>
        {!isCollapsed && (
          <div className="sidebar-title">{t('sidebar_title')}</div>
        )}
      </div>

      {/* 侧边栏导航 */}
      <nav className="sidebar-nav">
        <ul className="sidebar-nav-list">
          {navItems.map((item) => (
            <li 
              key={item.name} 
              className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <button 
                type="button" 
                className="sidebar-nav-link"
                onClick={() => handleNavigation(item.path)}
              >
                <i data-feather="chevron-right" className="nav-item-arrow"></i>
                <span className="nav-item-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* 侧边栏底部 */}
      {user && !isCollapsed && (
        <div className="sidebar-footer">
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.username}</div>
            <div className="sidebar-user-role">{user.role || t('user')}</div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;