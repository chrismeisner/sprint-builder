/**
 * Journey Page Scripts
 * Shared functionality for user journey pages:
 * - Persona display and modal
 * - Carousel navigation
 * - CSV export
 */

(function() {
  'use strict';

  // ============================================
  // PERSONA DISPLAY
  // Determines which persona to use based on page
  // ============================================
  let currentPersona = null;

  function getPersonaIndex() {
    const path = window.location.pathname;
    if (path.includes('teen')) return 1;
    return 0; // Default to parent (first persona)
  }

  function renderJourneyUser() {
    if (typeof PERSONAS === 'undefined' || !PERSONAS.length) return;
    
    const index = getPersonaIndex();
    currentPersona = PERSONAS[index] || PERSONAS[0];
    
    const avatarEl = document.getElementById('journeyUserAvatar');
    if (!avatarEl) return;
    
    if (currentPersona.avatar) {
      avatarEl.innerHTML = `<img src="${currentPersona.avatar}" alt="${currentPersona.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`;
    } else {
      avatarEl.textContent = currentPersona.emoji || '👤';
    }
    
    const role = currentPersona.roleRelationship?.role || currentPersona.role || '';
    
    const nameEl = document.getElementById('journeyUserName');
    const roleEl = document.getElementById('journeyUserRole');
    const quoteEl = document.getElementById('journeyUserQuote');
    
    if (nameEl) nameEl.textContent = currentPersona.name;
    if (roleEl) roleEl.textContent = role;
    if (quoteEl) quoteEl.textContent = `"${currentPersona.quote}"`;
  }

  // ============================================
  // USER DETAIL MODAL
  // ============================================
  function initModal() {
    const modalOverlay = document.getElementById('userModalOverlay');
    const openModalBtn = document.getElementById('openUserModal');
    const closeModalBtn = document.getElementById('closeUserModal');
    
    if (!modalOverlay || !openModalBtn) return;

    function openModal() {
      if (!currentPersona) return;
      
      const modalAvatarEl = document.getElementById('modalUserAvatar');
      if (currentPersona.avatar) {
        modalAvatarEl.innerHTML = `<img src="${currentPersona.avatar}" alt="${currentPersona.name}" />`;
      } else {
        modalAvatarEl.textContent = currentPersona.emoji || '👤';
      }
      
      const role = currentPersona.roleRelationship?.role || currentPersona.role || '';
      const painPoints = currentPersona.trustFairness?.breaksTrust || currentPersona.painPoints || [];
      const behaviors = currentPersona.triggersJobs?.jobsToBeDone || currentPersona.behaviors || [];
      
      document.getElementById('modalUserName').textContent = currentPersona.name;
      document.getElementById('modalUserRole').textContent = role;
      document.getElementById('modalUserQuote').textContent = currentPersona.quote;
      
      document.getElementById('modalUserTags').innerHTML = (currentPersona.tags || [])
        .map(tag => `<span class="user-modal-tag">${tag}</span>`)
        .join('');
      
      document.getElementById('modalUserGoals').innerHTML = (currentPersona.goals || [])
        .map(goal => `<li>${goal}</li>`)
        .join('');
      
      document.getElementById('modalUserPains').innerHTML = painPoints
        .map(pain => `<li>${pain}</li>`)
        .join('');
      
      document.getElementById('modalUserBehaviors').innerHTML = behaviors
        .map(behavior => `<li>${behavior}</li>`)
        .join('');
      
      document.getElementById('modalUserStages').innerHTML = (currentPersona.journeyStages || [])
        .map(stage => `<span class="user-modal-stage-tag">${stage}</span>`)
        .join('');
      
      modalOverlay.classList.add('visible');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modalOverlay.classList.remove('visible');
      document.body.style.overflow = '';
    }

    openModalBtn.addEventListener('click', openModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalOverlay.classList.contains('visible')) {
        closeModal();
      }
    });
  }

  // ============================================
  // CSV EXPORT
  // ============================================
  function initExport() {
    const exportBtn = document.getElementById('exportCsvBtn');
    if (!exportBtn) return;

    function escapeCSV(str) {
      if (str == null) return '';
      const s = String(str);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    }

    function getStageData() {
      const stageElements = document.querySelectorAll('.journey-stage');
      const data = [];

      stageElements.forEach((stage, index) => {
        const name = stage.querySelector('.stage-name')?.textContent.trim() || '';
        const goal = stage.querySelector('.stage-section:nth-child(1) .stage-text')?.textContent.trim() || '';
        
        const actionsList = stage.querySelectorAll('.stage-section:nth-child(2) .stage-list li');
        const actions = Array.from(actionsList).map(li => li.textContent.trim()).join('; ');
        
        const touchpoints = stage.querySelector('.stage-section:nth-child(3) .stage-text')?.textContent.trim() || '';
        const emotion = stage.querySelector('.emotion-indicator')?.textContent.trim() || '';
        
        const painPoint = stage.querySelector('.callout-pain .stage-callout-text')?.textContent.trim() || '';
        const opportunity = stage.querySelector('.callout-opportunity .stage-callout-text')?.textContent.trim() || '';

        data.push({
          stage: index + 1,
          name,
          goal,
          actions,
          touchpoints,
          emotion,
          painPoint,
          opportunity
        });
      });

      return data;
    }

    function exportToCSV() {
      const data = getStageData();
      const journeyName = document.querySelector('h1')?.textContent.trim() || 'User Journey';
      
      const headers = ['Stage', 'Name', 'User Goal', 'Actions', 'Touchpoints', 'Emotion', 'Pain Point', 'Opportunity'];
      
      let csv = `Journey: ${escapeCSV(journeyName)}\n\n`;
      csv += headers.map(escapeCSV).join(',') + '\n';
      
      data.forEach(row => {
        csv += [
          row.stage,
          escapeCSV(row.name),
          escapeCSV(row.goal),
          escapeCSV(row.actions),
          escapeCSV(row.touchpoints),
          escapeCSV(row.emotion),
          escapeCSV(row.painPoint),
          escapeCSV(row.opportunity)
        ].join(',') + '\n';
      });

      if (currentPersona) {
        const role = currentPersona.roleRelationship?.role || currentPersona.role || '';
        const painPoints = currentPersona.trustFairness?.breaksTrust || currentPersona.painPoints || [];
        const behaviors = currentPersona.triggersJobs?.jobsToBeDone || currentPersona.behaviors || [];
        const goals = currentPersona.goals || [];
        const tags = currentPersona.tags || [];
        const journeyStages = currentPersona.journeyStages || [];
        
        csv += '\n';
        csv += 'User Profile\n';
        csv += `Name,${escapeCSV(currentPersona.name)}\n`;
        csv += `Role,${escapeCSV(role)}\n`;
        csv += `Tags,${escapeCSV(tags.join('; '))}\n`;
        csv += `Quote,${escapeCSV(currentPersona.quote)}\n`;
        csv += '\n';
        csv += 'Demographics\n';
        if (currentPersona.demographics) {
          csv += `Age,${escapeCSV(currentPersona.demographics.age || '')}\n`;
          csv += `Location,${escapeCSV(currentPersona.demographics.location || '')}\n`;
          csv += `Tech Level,${escapeCSV(currentPersona.demographics.techLevel || '')}\n`;
        }
        csv += '\n';
        csv += `Goals,${escapeCSV(goals.join('; '))}\n`;
        csv += `Pain Points,${escapeCSV(painPoints.join('; '))}\n`;
        csv += `Jobs to be Done,${escapeCSV(behaviors.join('; '))}\n`;
        csv += `Key Journey Stages,${escapeCSV(journeyStages.join('; '))}\n`;
      }

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      
      const filename = journeyName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.csv';
      link.setAttribute('download', filename);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    exportBtn.addEventListener('click', exportToCSV);
  }

  // ============================================
  // CAROUSEL
  // ============================================
  function initCarousel() {
    const carousel = document.getElementById('journeyCarousel');
    if (!carousel) return;
    
    const container = carousel.querySelector('.carousel-container');
    const track = carousel.querySelector('.carousel-track');
    const stages = track.querySelectorAll('.journey-stage');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const dotsContainer = document.getElementById('carouselDots');
    const controlsContainer = carousel.querySelector('.carousel-controls');
    
    let currentIndex = 0;
    const totalStages = stages.length;
    const gap = 20;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let animationId = null;
    let hasInteracted = false;
    let isHorizontalSwipe = null;

    // ============================================
    // MOBILE UI ELEMENTS
    // ============================================
    
    // Create step counter for mobile
    const stepCounter = document.createElement('div');
    stepCounter.className = 'carousel-step-counter';
    stepCounter.innerHTML = `
      <span class="carousel-step-counter-text">Step</span>
      <span class="carousel-step-counter-current" id="stepCounterCurrent">1</span>
      <span class="carousel-step-counter-total">of ${totalStages}</span>
    `;
    carousel.insertBefore(stepCounter, container);
    
    // Create swipe hint for mobile
    const swipeHint = document.createElement('div');
    swipeHint.className = 'carousel-swipe-hint';
    swipeHint.innerHTML = `
      <span>Swipe to navigate</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>
    `;
    carousel.insertBefore(swipeHint, container);
    
    // Create progress bar for mobile
    const progressBar = document.createElement('div');
    progressBar.className = 'carousel-progress';
    progressBar.innerHTML = '<div class="carousel-progress-bar" id="progressBar"></div>';
    controlsContainer.insertAdjacentElement('afterend', progressBar);

    function getVisibleCount() {
      const width = carousel.offsetWidth;
      if (width <= 600) return 1;
      if (width <= 900) return 2;
      return 3;
    }

    function isMobileView() {
      return window.innerWidth <= 600;
    }

    function getMaxIndex() {
      return Math.max(0, totalStages - getVisibleCount());
    }

    function getSlideWidth() {
      const visibleCount = getVisibleCount();
      return (carousel.offsetWidth - (gap * (visibleCount - 1))) / visibleCount + gap;
    }

    function createDots() {
      dotsContainer.innerHTML = '';
      const maxIndex = getMaxIndex();
      for (let i = 0; i <= maxIndex; i++) {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === currentIndex ? ' active' : '');
        dot.setAttribute('aria-label', `Go to position ${i + 1}`);
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
      }
    }

    function setTrackPosition() {
      track.style.transform = `translateX(${currentTranslate}px)`;
    }

    function updateMobileUI() {
      // Update step counter
      const stepCounterCurrent = document.getElementById('stepCounterCurrent');
      if (stepCounterCurrent) {
        stepCounterCurrent.textContent = currentIndex + 1;
      }
      
      // Update progress bar
      const progress = document.getElementById('progressBar');
      if (progress) {
        const maxIndex = getMaxIndex();
        const percentage = maxIndex > 0 ? ((currentIndex / maxIndex) * 100) : 100;
        progress.style.width = `${percentage}%`;
      }
      
    }

    function hideSwipeHint() {
      if (!hasInteracted) {
        hasInteracted = true;
        swipeHint.classList.add('hidden');
      }
    }

    function updateCarousel(animate = true) {
      const slideWidth = getSlideWidth();
      currentTranslate = -currentIndex * slideWidth;
      prevTranslate = currentTranslate;
      
      if (animate) {
        track.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      }
      setTrackPosition();
      
      const dots = dotsContainer.querySelectorAll('.carousel-dot');
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentIndex);
      });

      prevBtn.disabled = currentIndex === 0;
      nextBtn.disabled = currentIndex >= getMaxIndex();
      
      // Update mobile-specific UI
      updateMobileUI();
    }

    function goToSlide(index) {
      currentIndex = Math.max(0, Math.min(index, getMaxIndex()));
      updateCarousel();
      hideSwipeHint();
    }

    function nextSlide() {
      if (currentIndex < getMaxIndex()) {
        currentIndex++;
        updateCarousel();
        hideSwipeHint();
      }
    }

    function prevSlide() {
      if (currentIndex > 0) {
        currentIndex--;
        updateCarousel();
        hideSwipeHint();
      }
    }

    function getPositionX(e) {
      return e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
    }

    function getPositionY(e) {
      return e.type.includes('mouse') ? e.pageY : e.touches[0].clientY;
    }

    function dragStart(e) {
      isDragging = true;
      isHorizontalSwipe = null; // Reset direction detection
      startX = getPositionX(e);
      startY = getPositionY(e);
      prevTranslate = -currentIndex * getSlideWidth();
      
      container.classList.add('is-dragging');
      track.style.transition = 'none';
      
      if (animationId) cancelAnimationFrame(animationId);
      animationId = requestAnimationFrame(animationLoop);
    }

    function drag(e) {
      if (!isDragging) return;
      
      const currentX = getPositionX(e);
      const currentY = getPositionY(e);
      const diffX = currentX - startX;
      const diffY = currentY - startY;
      
      // Determine swipe direction on first significant movement
      if (isHorizontalSwipe === null && (Math.abs(diffX) > 10 || Math.abs(diffY) > 10)) {
        isHorizontalSwipe = Math.abs(diffX) > Math.abs(diffY);
      }
      
      // Only handle horizontal swipes
      if (isHorizontalSwipe === false) {
        return;
      }
      
      // Prevent vertical scrolling during horizontal swipe on mobile
      if (isHorizontalSwipe && e.cancelable) {
        e.preventDefault();
      }
      
      currentTranslate = prevTranslate + diffX;
      
      const maxTranslate = 0;
      const minTranslate = -getMaxIndex() * getSlideWidth();
      
      // Rubber band effect at edges
      if (currentTranslate > maxTranslate) {
        currentTranslate = maxTranslate + (currentTranslate - maxTranslate) * 0.25;
      } else if (currentTranslate < minTranslate) {
        currentTranslate = minTranslate + (currentTranslate - minTranslate) * 0.25;
      }
    }

    function dragEnd() {
      if (!isDragging) return;
      isDragging = false;
      
      container.classList.remove('is-dragging');
      cancelAnimationFrame(animationId);
      
      // Only process if it was a horizontal swipe
      if (isHorizontalSwipe !== false) {
        const slideWidth = getSlideWidth();
        const movedBy = currentTranslate - prevTranslate;
        // Lower threshold on mobile for easier swiping
        const threshold = isMobileView() ? slideWidth * 0.15 : slideWidth * 0.2;
        
        if (movedBy < -threshold && currentIndex < getMaxIndex()) {
          currentIndex++;
          hideSwipeHint();
        } else if (movedBy > threshold && currentIndex > 0) {
          currentIndex--;
          hideSwipeHint();
        }
      }
      
      isHorizontalSwipe = null;
      updateCarousel(true);
    }

    function animationLoop() {
      if (isDragging) {
        setTrackPosition();
        animationId = requestAnimationFrame(animationLoop);
      }
    }

    // Mouse events
    container.addEventListener('mousedown', dragStart);
    container.addEventListener('mousemove', drag);
    container.addEventListener('mouseup', dragEnd);
    container.addEventListener('mouseleave', dragEnd);

    // Touch events - use passive: false to allow preventDefault for horizontal swipes
    container.addEventListener('touchstart', dragStart, { passive: true });
    container.addEventListener('touchmove', drag, { passive: false });
    container.addEventListener('touchend', dragEnd);

    // Prevent drag on links/buttons inside cards
    track.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('mousedown', e => e.stopPropagation());
      el.addEventListener('touchstart', e => e.stopPropagation());
    });

    // Prevent image drag
    track.querySelectorAll('img').forEach(img => {
      img.addEventListener('dragstart', e => e.preventDefault());
    });

    // Button click handlers
    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      }
    });

    // Handle resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        currentIndex = Math.min(currentIndex, getMaxIndex());
        createDots();
        updateCarousel(false);
      }, 100);
    });

    // Initialize
    createDots();
    updateCarousel(false);
  }

  // ============================================
  // STAGE IMAGE SLIDESHOWS
  // Auto-fading mini carousels for stages with multiple images
  // ============================================
  function initStageSlideshows() {
    const slideshows = document.querySelectorAll('.stage-image-slideshow');
    
    slideshows.forEach((slideshow) => {
      const images = slideshow.querySelectorAll('img');
      if (images.length <= 1) return; // No slideshow needed for single image
      
      let currentIndex = 0;
      let isPaused = false;
      const intervalTime = parseInt(slideshow.dataset.interval) || 4000; // Default 4 seconds
      
      // Create numbered selectors
      const selectorsContainer = document.createElement('div');
      selectorsContainer.className = 'stage-image-selectors';
      
      images.forEach((img, index) => {
        // Set first image as active
        if (index === 0) img.classList.add('active');
        
        // Create numbered selector button
        const selector = document.createElement('button');
        selector.className = 'stage-image-selector' + (index === 0 ? ' active' : '');
        selector.textContent = index + 1;
        selector.setAttribute('aria-label', `Show image ${index + 1}`);
        selector.addEventListener('click', () => {
          // Stop auto-cycling when user clicks
          stopAutoCycle();
          goToImage(index);
        });
        selectorsContainer.appendChild(selector);
      });
      
      // Find the stage header to append selectors there (right-aligned with title)
      const stageCard = slideshow.closest('.journey-stage');
      const stageHeader = stageCard ? stageCard.querySelector('.stage-header') : null;
      
      if (stageHeader) {
        stageHeader.appendChild(selectorsContainer);
      } else {
        // Fallback to slideshow if header not found
        slideshow.appendChild(selectorsContainer);
      }
      
      // Mark as JS-initialized so CSS knows to use .active class
      slideshow.classList.add('js-initialized');
      const selectors = selectorsContainer.querySelectorAll('.stage-image-selector');
      
      function goToImage(index) {
        images[currentIndex].classList.remove('active');
        selectors[currentIndex].classList.remove('active');
        
        currentIndex = index;
        
        images[currentIndex].classList.add('active');
        selectors[currentIndex].classList.add('active');
      }
      
      function nextImage() {
        const nextIndex = (currentIndex + 1) % images.length;
        goToImage(nextIndex);
      }
      
      function stopAutoCycle() {
        if (!isPaused) {
          isPaused = true;
          clearInterval(interval);
          slideshow.classList.add('paused');
        }
      }
      
      // Auto-advance
      let interval = setInterval(nextImage, intervalTime);
      
      // Pause on hover (but don't permanently stop)
      slideshow.addEventListener('mouseenter', () => {
        if (!isPaused) {
          clearInterval(interval);
        }
      });
      
      slideshow.addEventListener('mouseleave', () => {
        if (!isPaused) {
          interval = setInterval(nextImage, intervalTime);
        }
      });
    });
  }

  // ============================================
  // IMAGE FALLBACK HANDLING
  // Shows placeholder when journey images fail to load
  // ============================================
  function initImageFallbacks() {
    const stageImages = document.querySelectorAll('.stage-image');
    
    stageImages.forEach((container, stageIndex) => {
      const imgs = container.querySelectorAll('img');
      const stageNumber = stageIndex + 1;
      
      imgs.forEach((img, imgIndex) => {
        // Store original src for hint display
        const expectedFilename = img.dataset.expectedFilename || img.src.split('/').pop();
        
        img.addEventListener('error', function() {
          // Hide the broken image
          this.style.display = 'none';
          
          // Check if placeholder already exists
          if (container.querySelector('.stage-image-placeholder')) return;
          
          // Check if there are other visible images (for slideshows)
          const visibleSiblings = Array.from(container.querySelectorAll('img')).filter(i => i.style.display !== 'none');
          if (visibleSiblings.length > 0) return;
          
          // Create placeholder
          const placeholder = document.createElement('div');
          placeholder.className = 'stage-image-placeholder';
          placeholder.innerHTML = `
            <svg class="stage-image-placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
            <span class="stage-image-placeholder-text">No Image</span>
            <span class="stage-image-placeholder-hint">${expectedFilename}</span>
          `;
          
          // For slideshows, insert into the slideshow container
          const slideshow = container.querySelector('.stage-image-slideshow');
          if (slideshow) {
            slideshow.appendChild(placeholder);
          } else {
            container.appendChild(placeholder);
          }
        });
        
        // Trigger error check for already-failed images
        if (img.complete && img.naturalHeight === 0) {
          img.dispatchEvent(new Event('error'));
        }
      });
    });
  }

  // ============================================
  // INITIALIZE
  // ============================================
  function init() {
    renderJourneyUser();
    initModal();
    initExport();
    initImageFallbacks();
    initCarousel();
    initStageSlideshows();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
