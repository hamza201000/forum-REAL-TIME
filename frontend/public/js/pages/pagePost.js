
import { sendData } from "../core/api.js";
import { renderContacts } from "../chat/renderContacts.js";
import { addMessage, openChat } from "../chat/chat.js";
import { escHtml, formatDate } from "../utils/helpers.js";
import { connectSocket, socket } from "../chat/socket.js"
import { updateOnlineCount, updatenewMsg, updateOnlineUsers, renderCount } from "../chat/renderContacts.js";
import { navigateTo } from "../core/router.js"
import { showError } from "../utils/validation.js";
import { safeSend } from "../chat/socket.js";

function logouthandler() {
  sendData({}, "/api/logout", "POST")
}
export async function createFeedPage(dataUser) {
  connectSocket()
  const app = document.getElementById("app");
  const user = dataUser || "User";
  const avatar = (user || "U")[0].toUpperCase();


  app.innerHTML = `
  
    <nav class="navbar">
      <span class="navbar-brand" id="nav-home">Forum</span>
      <div class="navbar-actions">
        <button class="hamburger" id="hamburger-btn" aria-label="Menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <button class="profile-btn" id="profile-btn">
          <div class="avatar" id="nav-avatar">${avatar}</div>
          <span class="profile-label" id="nav-username">${user || "Profile"}</span>
        </button>
        <button class="logout-btn" id="logout-btn">Log out</button>
      </div>
    </nav>

  
    <div class="layout">
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

      <div class="sidebar-overlay" id="sidebar-overlay"></div>

      <main class="feed-wrapper">
        <div class="feed-inner" id="feed-list"></div>
      </main>

      
      

    </div>

    <button class="fab" id="fab-btn" title="Create post">
      
    </button>

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
          <div class="modal-error" id="title-error"></div>
        </div>
        <div class="modal-field">
          <textarea id="modal-body" placeholder="What's on your mind?"
                    maxlength="1000"></textarea>
          <div class="char-count" id="modal-char-count">0 / 1000</div>
          <div class="modal-error" id="body-error"></div>

        </div>
        
        <div class="modal-divider">
          <select id="modal-category">
            <option value="" disabled selected>Choose category</option>
            <option value="general">General</option>
            <option value="news">News</option>
            <option value="tech">Tech</option>
            <option value="lifestyle">Lifestyle</option>
          </select>
          <div class="modal-error" id="category-error"></div>
        </div>
        <div class="modal-actions">
          <button class="modal-publish-btn" id="modal-publish">Publish</button>
        </div>
      </div>
    </div>
    
</div>
<div class="modal-overlay" id="post-popup">
    
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
    const catrgorySelect = document.getElementById("modal-category").value.trim();
    const categorySelect = document.getElementById("modal-category").value.trim();
    const titleError = document.getElementById("title-error")
    const bodyError = document.getElementById("body-error")
    titleError.classList.remove("visible")
    bodyError.classList.remove("visible")
    if (!title || !content||!categorySelect) {
      if (!title) {
        titleError.classList.add("visible")
        titleError.textContent = "⚠ Title cannot be empty"
      } else if (!content) {
        bodyError.classList.add("visible")
        bodyError.textContent = "⚠ Content cannot be empty"
      }else if (!categorySelect) {
        bodyError.classList.add("visible")
        bodyError.textContent = "⚠ Please select a category"
      }
      return;
    }
    try {
      await sendData({ title, content, category: categorySelect }, "/api/posts", "POST");
      closeModal(overlay);
      renderFeed();
    } catch (err) {
      console.error("Publish failed:", err);
    }
  });
  const logoutbutton = document.getElementById("logout-btn")
  logoutbutton.addEventListener("click", () => {
    logouthandler();
  });
  let users = await renderContacts();
  renderCount(users)
  socket.onmessage = async (event) => {
    const data = JSON.parse(event.data)
    if (data.type === "online_users") {
      (data);
      const userContacts = document.querySelectorAll(".contact-item")
      if (userContacts) {

        updateOnlineUsers(userContacts, data.user_ids)
      }
    } else if (data.type === "MsgtoReceiver" || data.type === "MsgtoSender") {
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
          safeSend({
            Type: "MsgSeen",
            Sender_id: Number(data.Sender_id),
            created_at: Date.now()
          })
        }
      }
      updateOnlineCount(users)
      updatenewMsg(data)
    } else if (data.type == "new_user") {
      console.log(data);
      users = await renderContacts();
      renderCount(users)
    }
  }
}



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
      const initial = (p.username || "U")[0].toUpperCase();
      const liked = p.likedBy?.includes(user.username);
      (p.created_at);

      return `
          <article class="post-card"  id = "post-${p.id}">
            <div class="post-card-header">
              <div class="post-card-header-left">
                <div class="post-avatar">${initial}</div>
                <div>
                  <span class="post-username">${escHtml(p.username || "Unknown")}</span>
                  <span class="post-time">Created At ${formatDate(p.created_at)}</span>                
                  </div>
              </div>
            </div>
            <div class="post-meta">
            <span>${p.category}</span>
            </div>
            <div class="post-divider" ></div>
            <div class="post-face" data-index="${p.id}">
            <h2 class="post-title">${escHtml(p.title)}</h2>
            <p class="post-body">${escHtml(p.content)}</p>
            </div>
            <div class="post-actions">
              <button class="like-btn" ${liked ? "liked" : ""} data-postid="${p.id}">
                <span class="likenmb-${p.id}" style="color: ${p.like_usr === 1 ? 'red' : ''}">
                  ${p.allLikes ?? 0} Likes
                </span>
              </button>

              <button class="comment-icon-btn" data-id="${p.id}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5
                           a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span>Comment</span>
              </button>
            </div>
          </article>
          `
        ;
    }).join("");
  } catch (err) {
    console.error("Failed to load feed:", err);
    list.innerHTML = `
        <div class="feed-empty">
          <p>Could not load posts.</p>
          <small>Check your connection and try again.</small>
        </div>`;
  }
}
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".like-btn")
  if (!btn) return
  const postId = btn.dataset.postid;
  try {
    await sendData({ postId: Number(postId) }, "/api/like", "POST");
    document.querySelectorAll(".likenmb-" + postId).forEach(like => {
      if (like.style.color === "red") {
        like.style.color = "";
        like.textContent = parseInt(like.textContent) - 1 + " Likes";
        return;
      }
      like.style.color = "red";
      like.textContent = parseInt(like.textContent) + 1 + " Likes";
    })

  } catch (err) {
    console.error("Like failed:", err);
  }
});

function openModal(element) {
  element.classList.add("active");
  document.getElementById("modal-title").focus();
}

function closeModal(element) {
  element.classList.remove("active");
  document.getElementById("modal-title").value = "";
  document.getElementById("modal-body").value = "";
  document.getElementById("modal-char-count").textContent = "0 / 1000";
  document.getElementById("modal-category").value = ""
  document.getElementById("title-error").classList.remove("visible")
  document.getElementById("body-error").classList.remove("visible")
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
  console.log("open");

  openChat(user);
  contactItem.style.backgroundColor = ""
  safeSend({
    Type: "MsgSeen",
    Sender_id: Number(user.id)
  })
});




document.addEventListener("click", async (e) => {

  const commentBtn = e.target.closest(".comment-icon-btn") || e.target.closest(".post-face");
  const isactv = document.getElementById("post-popup")
  if (commentBtn) {
    const postId = commentBtn.dataset.id || commentBtn.dataset.index
    const post = document.getElementById("post-" + postId);
    if (isactv && isactv.classList.contains("active")) {
      return
    }
    isactv.innerHTML = openPopup(post.innerHTML, postId)
    isactv.classList.add("active");

    await refreshComments(postId)

    return;
  }
  if (e.target === isactv) {
    isactv.classList.remove("active");
    isactv.innerHTML = ""
    return;
  }

  const sendBtn = e.target.closest(".send-comment-btn");
  if (sendBtn) {
    const postId = sendBtn.id.replace("send-btn-", "");
    const input = document.getElementById("comment-input-" + postId);
    const content = input.value.trim();
    if (!content) return;

    await sendData({ content, postId: Number(postId) }, "/api/comments", "POST")
      .then(() => {
        input.value = "";
        input.style.height = "auto";
      })

    const commList = document.getElementById("comment-list-" + postId)
    if (!commList) return
    await refreshComments(postId)
    return;
  }

});


function openPopup(contnainer, postId) {
  return `
      <div class="modal-card" id="modal-card">
        ${contnainer}
        <div class="comment-section" id="comment-section-${postId || 0}">
  <!-- Input -->
  <div class="comment-input-row">
    <textarea id="comment-input-${postId || 0}" placeholder="Write a comment…" rows="1"></textarea>
    <button class="send-comment-btn" id="send-btn-${postId || 0}" >Post</button>
  </div>
  <!-- List -->
  <div class="comment-list" id="comment-list-${postId || 0}">
    <div class="comments-loading">Loading comments…</div>
  </div>
</div>
      </div>
    </div>
`

}



async function refreshComments(postId) {
  const commentListContainer = document.getElementById("comment-list-" + postId);
  if (!commentListContainer) return;
  commentListContainer.innerHTML = `<div class="comments-loading">Loading comments…</div>`;
  try {
    const res = await sendData({}, `/api/getComments?postId=${postId}`, "GET");
    const comments = res?.comments || [];
    const commentList = comments.map(c => `
          <div class="comment-item">
            <div class="comment-header">
              <div class="comment-avatar">${c.username[0].toUpperCase()}</div>
              <div>
                <span class="comment-username">${escHtml(c.username)}</span>
                
              </div>
            </div>
            <p class="comment-content">${escHtml(c.content)}</p>
          </div>
        `).join("")
    commentListContainer.innerHTML = commentList || `<p style="text-align:center;color:#666">No comments yet.</p>`;
    commentListContainer.scrollTop = commentListContainer.scrollHeight;
  } catch (err) {
    console.error("Failed to refresh comments:", err);
    commentListContainer.innerHTML = `<p style="color:red;text-align:center">Failed to load comments.</p>`;
  }
}
