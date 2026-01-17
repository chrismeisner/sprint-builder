/**
 * Sidebar Navigation Component for Styleguide
 * A reusable collapsible sidebar for navigating between styleguide pages
 */

(function() {
  'use strict';

  const STORAGE_KEY = 'styleguide-sidebar-open';

  const NAV_ITEMS = [
    { href: 'logo-style.html', label: 'Logo', icon: '🏷️' },
    { href: 'colors.html', label: 'Colors', icon: '🎨' },
    { href: 'fonts.html', label: 'Typography', icon: '🔤' },
    { href: 'image-style.html', label: 'Images', icon: '🖼️' },
    { href: 'style-tiles.html', label: 'Style Tiles', icon: '📱' },
    { href: 'changelog.html', label: 'Changelog', icon: '📋' }
  ];

  function getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';
    return filename;
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

    // Create sidebar HTML
    const sidebarHTML = `
      <nav class="sidebar-nav ${isOpen ? '' : 'collapsed'}" id="sidebarNav" aria-label="Styleguide navigation">
        <div class="sidebar-header">
          <img src="images/miles-logos/miles-badge-green.png" alt="Brand logo" class="sidebar-logo" />
          <h2 class="sidebar-title">Styleguide</h2>
          <button class="sidebar-collapse-btn" id="sidebarCollapseBtn" type="button" aria-label="Collapse sidebar" title="Collapse sidebar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
        </div>
        <ul class="sidebar-menu">
          ${NAV_ITEMS.map(item => `
            <li>
              <a href="${item.href}" class="sidebar-link ${currentPage === item.href ? 'active' : ''}" ${currentPage === item.href ? 'aria-current="page"' : ''}>
                <span class="sidebar-link-icon">${item.icon}</span>
                <span>${item.label}</span>
              </a>
            </li>
          `).join('')}
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
      <div class="sidebar-overlay" id="sidebarOverlay"></div>
    `;

    // Insert sidebar at the beginning of body
    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);

    // Get references
    const sidebar = document.getElementById('sidebarNav');
    const toggle = document.getElementById('sidebarToggle');
    const collapseBtn = document.getElementById('sidebarCollapseBtn');
    const overlay = document.getElementById('sidebarOverlay');

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
      overlay.classList.add('visible');
      toggle.setAttribute('aria-expanded', 'true');
      saveState(true);
    }

    // Close sidebar
    function closeSidebar() {
      sidebar.classList.add('collapsed');
      overlay.classList.remove('visible');
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
    
    // Overlay click closes the sidebar
    overlay.addEventListener('click', closeSidebar);

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
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createSidebar);
  } else {
    createSidebar();
  }
})();
