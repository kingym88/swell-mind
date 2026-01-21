// SwellMind Web Prototype - Interactive JavaScript

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initTabs();
  initRatingSlider();
  initSpotPills();
  initAnimations();
});

// ===== Navigation =====
function initNavigation() {
  const navItems = document.querySelectorAll(".nav-item[data-screen]");

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const screenId = item.dataset.screen;
      navigateTo(screenId);

      // Update active nav item
      navItems.forEach((nav) => nav.classList.remove("active"));
      item.classList.add("active");
    });
  });
}

function navigateTo(screenId) {
  const screens = document.querySelectorAll(".screen");
  const targetScreen = document.getElementById(`screen-${screenId}`);

  screens.forEach((screen) => {
    screen.classList.remove("active");
  });

  if (targetScreen) {
    targetScreen.classList.add("active");

    // Reset scroll position
    const content = targetScreen.querySelector(".screen-content");
    if (content) {
      content.scrollTop = 0;
    }
  }

  // Update nav items
  const navItems = document.querySelectorAll(".nav-item[data-screen]");
  navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.screen === screenId);
  });
}

// ===== Tabs =====
function initTabs() {
  const tabs = document.querySelectorAll(".tab");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabId = tab.dataset.tab;
      const container = tab.closest(".screen");

      // Update tab buttons
      container
        .querySelectorAll(".tab")
        .forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      // Update tab content
      container.querySelectorAll(".tab-content").forEach((content) => {
        content.classList.remove("active");
      });

      const targetContent = container.querySelector(`#tab-${tabId}`);
      if (targetContent) {
        targetContent.classList.add("active");
      }
    });
  });
}

// ===== Rating Slider =====
function initRatingSlider() {
  const slider = document.getElementById("rating-slider");
  const display = document.getElementById("rating-display");

  if (slider && display) {
    slider.addEventListener("input", () => {
      display.textContent = slider.value;

      // Update color based on rating
      const value = parseInt(slider.value);
      if (value <= 3) {
        display.style.color = "#FF9800";
      } else if (value <= 6) {
        display.style.color = "#FFC107";
      } else {
        display.style.color = "#4CAF50";
      }
    });
  }
}

// ===== Spot Pills =====
function initSpotPills() {
  const pills = document.querySelectorAll(".spot-pill");

  pills.forEach((pill) => {
    pill.addEventListener("click", () => {
      pills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");

      // Simulate loading new forecast data
      showForecastLoading();
    });
  });
}

function showForecastLoading() {
  const heroCard = document.querySelector(".hero-card");
  heroCard.style.opacity = "0.7";

  setTimeout(() => {
    heroCard.style.opacity = "1";
    // In a real app, you'd update the forecast data here
  }, 500);
}

// ===== Modal Controls =====
function openLogModal() {
  const modal = document.getElementById("log-modal");
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeLogModal() {
  const modal = document.getElementById("log-modal");
  modal.classList.remove("active");
  document.body.style.overflow = "";
}

function submitSession(event) {
  event.preventDefault();

  // Get form values
  const rating = document.getElementById("rating-slider").value;

  // Show success feedback
  const btn = event.target;
  const originalText = btn.textContent;
  btn.textContent = "✓ Logged!";
  btn.style.background = "#4CAF50";

  setTimeout(() => {
    closeLogModal();
    btn.textContent = originalText;
    btn.style.background = "";

    // Show success notification
    showNotification("Session logged successfully! 🏄");
  }, 1000);
}

// ===== Notifications =====
function showNotification(message) {
  // Create notification element
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;
  notification.style.cssText = `
        position: fixed;
        top: 60px;
        left: 50%;
        transform: translateX(-50%);
        background: #1A2332;
        color: white;
        padding: 12px 24px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 500;
        z-index: 1000;
        animation: slideDown 0.3s ease, fadeOut 0.3s ease 2.7s;
    `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// ===== Animations =====
function initAnimations() {
  // Animate progress bars on load
  const progressBars = document.querySelectorAll(".progress-fill");
  progressBars.forEach((bar) => {
    const width = bar.style.width;
    bar.style.width = "0";
    setTimeout(() => {
      bar.style.width = width;
    }, 300);
  });

  // Animate bars in charts
  const chartBars = document.querySelectorAll(".bar, .h-bar");
  chartBars.forEach((bar, index) => {
    const value = bar.style.height || bar.style.width;
    if (bar.classList.contains("bar")) {
      bar.style.height = "0";
    } else {
      bar.style.width = "0";
    }

    setTimeout(
      () => {
        if (bar.classList.contains("bar")) {
          bar.style.height = value;
        } else {
          bar.style.width = value;
        }
      },
      300 + index * 100,
    );
  });

  // Animate score badges
  animateScores();
}

function animateScores() {
  const scoreBadges = document.querySelectorAll(".window-score, .score-value");

  scoreBadges.forEach((badge) => {
    const finalValue = parseInt(badge.textContent);
    if (isNaN(finalValue)) return;

    let currentValue = 0;
    const duration = 1000;
    const increment = finalValue / (duration / 16);

    const animate = () => {
      currentValue += increment;
      if (currentValue < finalValue) {
        badge.textContent = Math.floor(currentValue);
        requestAnimationFrame(animate);
      } else {
        badge.textContent = finalValue;
      }
    };

    animate();
  });
}

// ===== Interactive Elements =====

// Toggle buttons
document.querySelectorAll(".toggle-btn, .option-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const group = btn.parentElement;
    group
      .querySelectorAll("button")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// Window cards click
document.querySelectorAll(".window-card").forEach((card) => {
  card.addEventListener("click", () => {
    card.style.transform = "scale(0.95)";
    setTimeout(() => {
      card.style.transform = "";
      openLogModal();
    }, 150);
  });
});

// Session cards expand
document.querySelectorAll(".session-card").forEach((card) => {
  card.addEventListener("click", () => {
    card.classList.toggle("expanded");
  });
});

// Map pins click
document.querySelectorAll(".map-pin").forEach((pin) => {
  pin.addEventListener("click", () => {
    const label = pin.querySelector(".pin-label").textContent;
    showNotification(`Selected: ${label}`);
  });
});

// Settings items click
document.querySelectorAll(".settings-item").forEach((item) => {
  item.addEventListener("click", (e) => {
    // Don't trigger for toggle switches
    if (e.target.closest(".toggle")) return;

    const text = item.querySelector("span:first-child").textContent;
    if (!item.classList.contains("danger")) {
      showNotification(`Opening: ${text}`);
    } else {
      if (confirm("Are you sure you want to delete your account?")) {
        showNotification("Account deletion initiated...");
      }
    }
  });
});

// Close modal on background click
document.getElementById("log-modal").addEventListener("click", (e) => {
  if (e.target.id === "log-modal") {
    closeLogModal();
  }
});

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeLogModal();
  }
});

// ===== CSS Injection for Notifications =====
const style = document.createElement("style");
style.textContent = `
    @keyframes slideDown {
        from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    .session-card.expanded {
        background: linear-gradient(135deg, #006494 0%, #0582CA 100%);
    }
`;
document.head.appendChild(style);

// ===== Mock Data =====
const mockSpots = [
  { name: "Ericeira", score: 92, distance: 15 },
  { name: "Peniche", score: 85, distance: 45 },
  { name: "Guincho", score: 62, distance: 8 },
  { name: "Cascais", score: 55, distance: 12 },
  { name: "Carcavelos", score: 48, distance: 5 },
];

const mockSessions = [
  {
    spot: "Ericeira",
    rating: 9,
    date: "2 days ago",
    conditions: "1.5m @ 12s, Offshore",
  },
  {
    spot: "Peniche",
    rating: 8,
    date: "5 days ago",
    conditions: "1.8m @ 10s, Cross-offshore",
  },
  {
    spot: "Guincho",
    rating: 6,
    date: "1 week ago",
    conditions: "1.1m @ 8s, Onshore",
  },
  {
    spot: "Carcavelos",
    rating: 7,
    date: "2 weeks ago",
    conditions: "1.2m @ 9s, Light offshore",
  },
];

const mockWindows = [
  {
    time: "Wed 8AM",
    score: 85,
    conditions: "1.3m, Offshore",
    recommended: true,
  },
  { time: "Thu 6AM", score: 78, conditions: "1.4m, Cross", recommended: true },
  {
    time: "Fri 11AM",
    score: 62,
    conditions: "1.1m, Onshore",
    recommended: false,
  },
  {
    time: "Sat 2PM",
    score: 45,
    conditions: "0.8m, Onshore",
    recommended: false,
  },
  {
    time: "Sun 7AM",
    score: 88,
    conditions: "1.6m, Offshore",
    recommended: true,
  },
];

console.log("SwellMind Prototype loaded! 🏄");
console.log("Mock data available:", { mockSpots, mockSessions, mockWindows });
