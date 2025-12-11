// src/components/common/Header.js
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { t } from '../../utils/language';
import '../../styles/components/Header.css';

const Header = ({ showEditorButtons = false, onSaveDocument, onBackToProject, onShowUserProfile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const handleLogout = () => {
    if (window.confirm(t('confirm_logout'))) {
      logout();
    }
  };

  const goToProfile = () => {
    // 如果上层传递了 onShowUserProfile，保持向后兼容，仍然触发它
    if (onShowUserProfile) {
      onShowUserProfile();
    }
    navigate('/profile');
  };

  const goToSettings = () => {
    navigate('/settings');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-title-container">
          <div className="header-title" onClick={() => navigate('/dashboard')}>
            {t('header_title')}
          </div>
        </div>
        
        {/* 桌面导航 */}
        <nav className="main-nav">
          <ul className="nav-list">
            {navItems.map((item) => (
              <li key={item.name} className={`nav-item ${isActive(item.path) ? 'active' : ''}`}>
                <button 
                  type="button" 
                  className="nav-link"
                  onClick={() => navigate(item.path)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* 移动端菜单按钮 */}
        <button 
          type="button" 
          className="mobile-menu-button"
          onClick={toggleMobileMenu}
        >
          <i data-feather={mobileMenuOpen ? 'x' : 'menu'}></i>
        </button>
        
        <div className="header-nav">
          {/* 编辑器按钮 */}
          {showEditorButtons && (
            <div className="editor-buttons">
              <button 
                type="button" 
                className="header-button" 
                onClick={onBackToProject}
              >
                <i data-feather="arrow-left"></i>
                <span>{t('back_to_project')}</span>
              </button>
            </div>
          )}
          
          {/* 语言下拉已移入设置中心 */}
          
          {user ? (
            <>
              <button className="header-button user-button" onClick={goToProfile}>
                {user.username || t('user_info')}
              </button>
              <button className="header-button logout-button" onClick={handleLogout}>
                {t('logout')}
              </button>
            </>
          ) : (
            <>
              <button className="header-button" onClick={onShowUserProfile}>
                {t('user_info')}
              </button>
              <button className="header-button logout-button" onClick={handleLogout}>
                {t('logout')}
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* 移动端导航菜单 */}
      {mobileMenuOpen && (
        <nav className="mobile-nav">
          <ul className="mobile-nav-list">
            {navItems.map((item) => (
              <li key={item.name} className={`mobile-nav-item ${isActive(item.path) ? 'active' : ''}`}>
                <button 
                  type="button" 
                  className="mobile-nav-link"
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
};

export default Header;