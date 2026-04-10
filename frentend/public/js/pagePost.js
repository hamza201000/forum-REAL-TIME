
import { sendData } from "./api.js";
import { renderContacts } from "./renderContacts.js";
import { addMessage, openChat } from "./chat.js";
import { escHtml, formatTime, safeSend } from "./helpers.js";
import { connectSocket, socket } from "./helpers.js";
import { updateOnlineCount, updatenewMsg, updateOnlineUsers, renderCount } from "./renderContacts.js";


export async function createFeedPage(data) {
  connectSocket()
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
    <div id="chat-container"></div>
  `;
  renderFeed();
  const overlay = document.getElementById("modal-overlay");
  document.getElementById("fab-btn").addEventListener("click", () => openModal(overlay));
  document.getElementById("modal-close").addEventListener("click", () => closeModal(overlay));
  overlay.addEventListener("click", e => { if (e.target === overlay) closeModal(overlay); });

  document.getElementById("modal-body").addEventListener("input", () => {
    const len = document.getElementById("modal-body").value.length;
    const counter = document.getElementById("modal-char-count");
    counter.textContent = `${len} / 1000`;
    counter.classList.toggle("warn", len > 900);
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



  document.getElementById("modal-publish").addEventListener("click", async () => {
    const title = document.getElementById("modal-title").value.trim();
    const content = document.getElementById("modal-body").value.trim();
    if (!title || !content) return;
    try {
      await sendData({ title, content }, "/api/posts", "POST");
      closeModal(overlay);
      renderFeed();
    } catch (err) {
      console.error("Publish failed:", err);
    }
  });
  document.getElementById("logout-btn").addEventListener("click", () => {
    sendData({}, "/api/logout", "POST");
  });
  const users = await renderContacts();
  renderCount(users)
  // safeSend({ type: "online_users" })
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (data.type === "online_users") {
      console.log(data);
      const userContacts = document.querySelectorAll(".contact-item")
      updateOnlineUsers(userContacts, data.user_ids)
    } else if (data.type === "MsgtoReceiver" || data.type === "MsgtoSender") {
      console.log("data", data);
      addMessage(data)
      users.forEach(u => {
        // Update last message for relevant users
        if (u.User_id === data.Sender_id || u.User_id === data.Receiver_id) {
          u.LastMsg = {
            id: data.id,
            Sender_id: data.Sender_id,
            Receiver_id: data.Receiver_id,
            Username_sender: data.Username_sender,
            Message: data.Message,
            Seen: data.Seen
          }
        }
      })
      if (data.type === "MsgtoReceiver") {
        const contactUser = document.getElementById("chat-" + data.Sender_id)
        if (contactUser) {
          socket.send(JSON.stringify({
            Type: "MsgSeen",
            Sender_id: Number(data.Sender_id)
          }))
        }
      }
      updateOnlineCount(users)
      updatenewMsg(data)
    };
  }
}



async function renderFeed() {
  const list = document.getElementById("feed-list");
  (list);

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


function openModal(element) {
  element.classList.add("active");
  document.getElementById("modal-title").focus();
}

function closeModal(element) {
  element.classList.remove("active");
  document.getElementById("modal-title").value = "";
  document.getElementById("modal-body").value = "";
  document.getElementById("modal-char-count").textContent = "0 / 1000";
}












document.body.addEventListener("click", (e) => {
  const contactItem = e.target.closest(".contact-item");
  if (!contactItem) return;
  const user = {
    id: contactItem.id,
    username: contactItem.querySelector(".contact-name").textContent,
    online: contactItem.querySelector(".online")
  };
  if (document.getElementById("chat-" + user.id)) return;
  document.getElementById("chat-container").innerHTML = ""
  openChat(user);
  contactItem.style.backgroundColor = ""
  safeSend({
    Type: "MsgSeen",
    Sender_id: Number(user.id)
  })
});











