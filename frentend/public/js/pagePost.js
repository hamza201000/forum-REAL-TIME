
import { sendData } from "./api.js";
import { navigateTo } from "./router.js";
export function createFeedPage(data) {
  const app = document.getElementById("app");
  const user = data || "User";
  const avatar = (user || "U")[0].toUpperCase();

  app.innerHTML = `
    <!-- ══ NAVBAR ══ -->
    <nav class="navbar">
      <span class="navbar-brand" id="nav-home">Forum</span>
      <div class="navbar-actions">
        <button class="hamburger" id="hamburger-btn" aria-label="Menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="3" y1="6"  x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <button class="profile-btn" id="profile-btn">
          <div class="avatar" id="nav-avatar">${avatar}</div>
          <span class="profile-label" id="nav-username">${user || "Profile"}</span>
        </button>
        <button class="logout-btn" id="logout-btn">Log out</button>
      </div>
    </nav>

    <!-- ══ LAYOUT ══ -->
    <div class="layout">

      <!-- LEFT: Contacts / Online bar -->
      <aside class="left-bar" id="left-bar">
        <div class="right-bar-header">
          <span class="right-bar-title">Contacts</span>
          <span class="online-pill" id="online-count">0 online</span>
        </div>
        <div class="contacts-list">
          <div id="online-contacts"></div>
          <div id="offline-section" style="display:none">
            <div class="contacts-section-label">Offline</div>
            <div id="offline-contacts"></div>
          </div>
        </div>
      </aside>

      <!-- Sidebar overlay (mobile) -->
      <div class="sidebar-overlay" id="sidebar-overlay"></div>

      <!-- CENTER: Feed -->
      <main class="feed-wrapper">
        <div class="feed-inner" id="feed-list"></div>
      </main>

      <!-- RIGHT: Navigation -->
      <aside class="right-bar" id="right-bar">
        <div class="sidebar-label">Navigation</div>

        <div class="sidebar-item active" id="nav-feed">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Feed
        </div>

        <div class="sidebar-item" id="nav-messages">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Messages
        </div>

        <div class="sidebar-item" id="nav-notifs">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          Notifications
        </div>

        
      </aside>

    </div><!-- end .layout -->

    <!-- FAB -->
    <button class="fab" id="fab-btn" title="Create post">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5"  y1="12" x2="19" y2="12"/>
      </svg>
    </button>

    <!-- Modal -->
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal-card" id="modal-card">
        <div class="modal-header">
          <div class="modal-avatar">${avatar}</div>
          <span class="modal-username">${user}</span>
          <button class="modal-close" id="modal-close">✕</button>
        </div>
        <div class="modal-field">
          <input id="modal-title" type="text" placeholder="Post title…"
                 maxlength="120" autocomplete="off"/>
        </div>
        <div class="modal-field">
          <textarea id="modal-body" placeholder="What's on your mind?"
                    maxlength="1000"></textarea>
          <div class="char-count" id="modal-char-count">0 / 1000</div>
        </div>
        <div class="modal-actions">
          <button class="modal-publish-btn" id="modal-publish">Publish</button>
        </div>
      </div>
    </div>
  `;

  //CONTACTS — fetch online users from API

  async function renderContacts() {
    try {
      // const ws = new WebSocket("ws://localhost:8080/api/ws")
      const res = await sendData({}, "/api/allUsers", "GET");
      const users = res && res.allusers ? res.allusers : [];

      document.getElementById("online-contacts").innerHTML =
        users.map(contactRow).join("");



      // setInterval(() => {
      //   if (ws.readyState === WebSocket.OPEN) {
      //     ws.send("ping")
      //   }
      // }, 3000)

      // ws.onmessage = (event) => {
      //   const msg = JSON.parse(event.data)

      //     console.log("server alive", msg);

      // };


      // const online = users.filter(u => u.online);
      // const offline = users.filter(u => !u.online);

      // // document.getElementById("online-count").textContent =
      // //   online.length + " online";


      // const offlineSection = document.getElementById("offline-section");
      // if (offline.length > 0) {
      //   document.getElementById("offline-contacts").innerHTML =
      //     offline.map(contactRow).join("");
      //   offlineSection.style.display = "";
      // } else {
      //   offlineSection.style.display = "none";
      // }
    } catch (err) {
      console.error("Failed to load contacts:", err);
    }
  }

  /* Expected shape per user from /api/online-users:
     { username: "alice", online: true, lastSeen: null | "5m ago" } */
  function contactRow(u) {
    console.log(u);

    const initial = (u.Username || "?")[0].toUpperCase();
    return `
   
      <div class="contact-item" id=${u.User_id}>
        <div class="contact-avatar-wrap">
          <div class="contact-avatar">${initial}</div>
          <span class="status-dot ${u.online ? "online" : "offline"}"></span>
        </div>
        <span class="contact-name">${u.Username}</span>
        ${!u.online && u.lastSeen
        ? `<span class="contact-time">${u.lastSeen}</span>`
        : ""}
      </div>`;
  }

  /* Poll contacts every 30 seconds */
  renderContacts();
  // const contactsInterval = setInterval(renderContacts, 30_000);

  /* ════════════════════════════════════════
     FEED
  ════════════════════════════════════════ */
  async function renderFeed() {
    const list = document.getElementById("feed-list");
    list.innerHTML = `<div class="feed-empty"><p>Loading…</p></div>`;

    try {
      const res = await sendData({}, "/api/getPosts", "GET");
      const posts = res?.allpost ?? [];

      if (posts.length === 0) {
        list.innerHTML = `
          <div class="feed-empty">
            <p>No posts yet — be the first!</p>
            <small>Click the + button below to create one.</small>
          </div>`;
        return;
      }

      list.innerHTML = posts.map((p, i) => {
        const idx = posts.length - 1 - i;
        const initial = (p.username || "U")[0].toUpperCase();
        const liked = p.likedBy?.includes(user.username);
        return `
          <article class="post-card" data-index="${idx}">
            <div class="post-card-header">
              <div class="post-card-header-left">
                <div class="post-avatar">${initial}</div>
                <div>
                  <span class="post-username">${escHtml(p.username || "Unknown")}</span>
                  <span class="post-time">${formatTime(p.createdAt)}</span>
                </div>
              </div>
              <button class="post-menu-btn" aria-label="Options">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="5" cy="12" r="2"/>
                  <circle cx="12" cy="12" r="2"/>
                  <circle cx="19" cy="12" r="2"/>
                </svg>
              </button>
            </div>

            <div class="post-divider"></div>

            <h2 class="post-title">${escHtml(p.title)}</h2>
            <p class="post-body">${escHtml(p.content)}</p>

            <div class="post-meta">
              <span>·</span>
              <span>${formatTime(p.createdAt)} min read</span>
            </div>

            <div class="post-actions">
              <button class="like-btn ${liked ? "liked" : ""}" data-postid="${p.id}">
                <svg width="15" height="15" viewBox="0 0 24 24"
                     fill="${liked ? "currentColor" : "none"}"
                     stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67
                           l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78
                           l1.06 1.06L12 21.23l7.78-7.78
                           1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span>${p.likes ?? 0} Likes</span>
              </button>

              <button class="comment-icon-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5
                           a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span>Comment</span>
              </button>
            </div>
          </article>`;
      }).join("");

      /* Like button events */
      list.querySelectorAll(".like-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const postId = btn.dataset.postid;
          try {
            await sendData({ postId }, "/api/like", "POST");
            renderFeed(); /* re-fetch to get accurate server state */
          } catch (err) {
            console.error("Like failed:", err);
          }
        });
      });

    } catch (err) {
      console.error("Failed to load feed:", err);
      list.innerHTML = `
        <div class="feed-empty">
          <p>Could not load posts.</p>
          <small>Check your connection and try again.</small>
        </div>`;
    }
  }

  /* ════════════════════════════════════════
     MODAL
  ════════════════════════════════════════ */
  const overlay = document.getElementById("modal-overlay");

  function openModal() {
    overlay.classList.add("active");
    document.getElementById("modal-title").focus();
  }
  function closeModal() {
    overlay.classList.remove("active");
    document.getElementById("modal-title").value = "";
    document.getElementById("modal-body").value = "";
    document.getElementById("modal-char-count").textContent = "0 / 1000";
  }

  document.getElementById("fab-btn").addEventListener("click", openModal);
  document.getElementById("modal-close").addEventListener("click", closeModal);
  overlay.addEventListener("click", e => { if (e.target === overlay) closeModal(); });

  document.getElementById("modal-body").addEventListener("input", () => {
    const len = document.getElementById("modal-body").value.length;
    const counter = document.getElementById("modal-char-count");
    counter.textContent = `${len} / 1000`;
    counter.classList.toggle("warn", len > 900);
  });

  document.getElementById("modal-publish").addEventListener("click", async () => {
    const title = document.getElementById("modal-title").value.trim();
    const content = document.getElementById("modal-body").value.trim();
    if (!title || !content) return;
    try {
      await sendData({ title, content }, "/api/posts", "POST");
      closeModal();
      renderFeed();
    } catch (err) {
      console.error("Publish failed:", err);
    }
  });
  const leftBar = document.getElementById("left-bar");
  const sidebarOverlay = document.getElementById("sidebar-overlay");
  const hamburgerBtn = document.getElementById("hamburger-btn");

  function toggleContacts() {
    leftBar.classList.toggle("open");
    sidebarOverlay.classList.toggle("open");
  }
  hamburgerBtn.addEventListener("click", toggleContacts);
  sidebarOverlay.addEventListener("click", toggleContacts);


  document.getElementById("nav-home")
    .addEventListener("click", () => navigateTo("/"));

  document.getElementById("nav-feed")
    .addEventListener("click", () => navigateTo("/"));
  document.getElementById("logout-btn").addEventListener("click", () => {
    clearInterval(contactsInterval);
    sendData({}, "/api/logout", "POST");
  });
  renderFeed();
}

/* ── Helpers ── */
function escHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatTime(ts) {
  if (!ts) return "";
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString();
}


function openChat(user) {
  const container = document.getElementById("chat-container");

  // prevent opening same chat twice
  if (document.getElementById("chat-" + user.id)) return;

  const chatBox = document.createElement("div");
  chatBox.className = "chat-box";
  chatBox.id = "chat-" + user.id;

  chatBox.innerHTML = `
    <div class="chat-header">
      <div class="chat-user">
        <span>${user.username}</span>
        <span class="chat-status ${user.online ? "online" : "offline"}"></span>
      </div>
      <button onclick="closeChat('${user.id}')">✕</button>
    </div>

    <div class="chat-body" id="messages-${user.id}">
      <!-- messages will come from backend -->
    </div>

    <div class="chat-input">
      <input type="text" placeholder="Type a message..."
        onkeydown="sendMessage(event, '${user.id}')">
    </div>
  `;

  container.appendChild(chatBox);
}


function closeChat(userId) {
  const chat = document.getElementById("chat-" + userId);
  if (chat) chat.remove();
}

function sendMessage(e, userId) {
  if (e.key === "Enter") {
    const input = e.target;
    const message = input.value.trim();
    if (!message) return;

    // TEMP: show message in UI
    const msgBox = document.getElementById("messages-" + userId);
    const msg = document.createElement("div");
    msg.textContent = message;
    msgBox.appendChild(msg);

    input.value = "";

    // TODO: send via WebSocket (Go backend)
    // socket.send(JSON.stringify({ to: userId, message }));
  }
}
document.body.addEventListener("click", (e) => {
  const contactItem = e.target.closest(".contact-item");

  if (!contactItem) return;

  const user = {
    id: contactItem.id,
    username: contactItem.querySelector(".contact-name").textContent
  };

  openChat(user);
});


