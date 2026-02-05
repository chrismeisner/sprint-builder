/**
 * Sidebar Navigation Component for Styleguide
 * A reusable collapsible sidebar for navigating between styleguide pages
 */

(function() {
  'use strict';

  const STORAGE_KEY = 'styleguide-sidebar-open';
  const SUBMENU_STORAGE_KEY = 'styleguide-submenu-open';

  const NAV_ITEMS = [
    { href: 'logo-style.html', label: 'Logo', icon: '🏷️' },
    { href: 'colors.html', label: 'Colors', icon: '🎨' },
    { href: 'fonts.html', label: 'Typography', icon: '🔤' },
    { href: 'image-style.html', label: 'Images', icon: '🖼️' },
    { href: 'style-tiles.html', label: 'Style Tiles', icon: '📱' },
    { href: 'profiles.html', label: 'User Profiles', icon: '👤' },
    { href: 'user-journeys.html', label: 'User Journeys', icon: '🗺️' },
    { href: 'changelog.html', label: 'Changelog', icon: '📋' }
  ];

  function getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';
    return filename;
  }

  function isChildActive(item, currentPage) {
    if (!item.children) return false;
    return item.children.some(child => child.href === currentPage);
  }

  function getSubmenuState(key) {
    try {
      const saved = localStorage.getItem(SUBMENU_STORAGE_KEY + '-' + key);
      return saved === 'true';
    } catch (e) {
      return false;
    }
  }

  function saveSubmenuState(key, isOpen) {
    try {
      localStorage.setItem(SUBMENU_STORAGE_KEY + '-' + key, String(isOpen));
    } catch (e) {
      // Storage not available
    }
  }

  function getSavedState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === null ? true : saved === 'true';
    } catch (e) {
      return true;
    }
  }

  function saveState(isOpen) {
    try {
      localStorage.setItem(STORAGE_KEY, String(isOpen));
    } catch (e) {
      // Storage not available
    }
  }

  function createSidebar() {
    const currentPage = getCurrentPage();
    const isOpen = getSavedState();

    // Generate nav item HTML (handles both regular and items with children)
    function renderNavItem(item) {
      const isActive = currentPage === item.href;
      const hasChildren = item.children && item.children.length > 0;
      const childActive = isChildActive(item, currentPage);
      const submenuOpen = childActive || getSubmenuState(item.label);
      
      if (hasChildren) {
        return `
          <li class="sidebar-item-with-children ${submenuOpen ? 'expanded' : ''}">
            <div class="sidebar-link-wrapper">
              <a href="${item.href}" class="sidebar-link ${isActive || childActive ? 'active' : ''}" ${isActive ? 'aria-current="page"' : ''}>
                <span class="sidebar-link-icon">${item.icon}</span>
                <span>${item.label}</span>
              </a>
              <button class="sidebar-submenu-toggle" type="button" aria-label="Toggle submenu" data-submenu="${item.label}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>
            <ul class="sidebar-submenu">
              ${item.children.map(child => `
                <li>
                  <a href="${child.href}" class="sidebar-sublink ${currentPage === child.href ? 'active' : ''}" ${currentPage === child.href ? 'aria-current="page"' : ''}>
                    ${child.label}
                  </a>
                </li>
              `).join('')}
            </ul>
          </li>
        `;
      }
      
      return `
        <li>
          <a href="${item.href}" class="sidebar-link ${isActive ? 'active' : ''}" ${isActive ? 'aria-current="page"' : ''}>
            <span class="sidebar-link-icon">${item.icon}</span>
            <span>${item.label}</span>
          </a>
        </li>
      `;
    }

    // Create sidebar HTML
    const sidebarHTML = `
      <nav class="sidebar-nav ${isOpen ? '' : 'collapsed'}" id="sidebarNav" aria-label="Styleguide navigation">
        <div class="sidebar-header">
          <a href="index.html" style="display: flex; align-items: center; gap: 12px; text-decoration: none; flex: 1; min-width: 0;">
            <img src="images/miles-logos/miles-badge-green.png" alt="Brand logo" class="sidebar-logo" />
            <h2 class="sidebar-title">Styleguide</h2>
          </a>
          <button class="sidebar-collapse-btn" id="sidebarCollapseBtn" type="button" aria-label="Collapse sidebar" title="Collapse sidebar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
        </div>
        <ul class="sidebar-menu">
          ${NAV_ITEMS.map(item => renderNavItem(item)).join('')}
        </ul>
        <div class="sidebar-footer">
          <a href="index.html" class="sidebar-home-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
            Back to Overview
          </a>
        </div>
      </nav>
      <button class="sidebar-toggle" id="sidebarToggle" type="button" aria-label="Open sidebar" aria-expanded="${isOpen}" aria-controls="sidebarNav">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>
    `;

    // Insert sidebar at the beginning of body
    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);

    // Get references
    const sidebar = document.getElementById('sidebarNav');
    const toggle = document.getElementById('sidebarToggle');
    const collapseBtn = document.getElementById('sidebarCollapseBtn');

    // Wrap existing content in styleguide-content div
    const existingContent = document.querySelector('.wrap');
    if (existingContent) {
      const wrapper = document.createElement('div');
      wrapper.className = 'styleguide-content';
      existingContent.parentNode.insertBefore(wrapper, existingContent);
      wrapper.appendChild(existingContent);
    }

    // Open sidebar
    function openSidebar() {
      sidebar.classList.remove('collapsed');
      toggle.setAttribute('aria-expanded', 'true');
      saveState(true);
    }

    // Close sidebar
    function closeSidebar() {
      sidebar.classList.add('collapsed');
      toggle.setAttribute('aria-expanded', 'false');
      saveState(false);
    }

    // Toggle functionality
    function toggleSidebar() {
      if (sidebar.classList.contains('collapsed')) {
        openSidebar();
      } else {
        closeSidebar();
      }
    }

    // External toggle opens the sidebar
    toggle.addEventListener('click', openSidebar);
    
    // Internal collapse button closes the sidebar
    collapseBtn.addEventListener('click', closeSidebar);

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
      // Close on Escape
      if (e.key === 'Escape' && !sidebar.classList.contains('collapsed')) {
        toggleSidebar();
      }
      // Toggle with Cmd/Ctrl + B
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    });

    // Submenu toggle functionality
    const submenuToggles = sidebar.querySelectorAll('.sidebar-submenu-toggle');
    submenuToggles.forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const parent = this.closest('.sidebar-item-with-children');
        const submenuKey = this.getAttribute('data-submenu');
        const isExpanded = parent.classList.contains('expanded');
        
        parent.classList.toggle('expanded');
        saveSubmenuState(submenuKey, !isExpanded);
      });
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createSidebar);
  } else {
    createSidebar();
  }
})();
