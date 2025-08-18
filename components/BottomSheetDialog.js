class BottomSheetDialog {
  constructor(context) {
    this.context = context || document.body;
    this.cancelable = true;
    this.boundOnDrag = this.onDrag.bind(this);
    this.boundEndDrag = this.endDrag.bind(this);
    this.overlay = document.createElement("div");
    this.overlay.setAttribute("role", "isOverlay");
    Object.assign(this.overlay.style, {
      width: "100%",
      height: "100%",
      position: "fixed",
      top: "0",
      left: "0",
      opacity: "0",
      transition: "opacity 0.3s ease",
      pointerEvents: "none",
      zIndex: "9999"
    });
    this.overlay.addEventListener("click", e => {
      if (Object.is(e.target.role, "isOverlay")) if (this.cancelable) this.dismiss();
    });
    this.sheet = document.createElement("div");
    Object.assign(this.sheet.style, {
      width: "100%",
      maxHeight: "80%",
      boxSizing: "border-box",
      borderTopLeftRadius: "15px",
      borderTopRightRadius: "15px",

      position: "absolute",
      left: "0",
      bottom: "-100%",
      overflowX: "hidden",
      transition: "bottom 0.3s ease",
      userSelect: "none"
    });
    this.container = document.createElement("div");
    Object.assign(this.container.style, {
      width: "100%",
      boxSizing: "border-box"
    });
    this.sheet.appendChild(this.container);
    this.overlay.appendChild(this.sheet);
    this.context.appendChild(this.overlay);
  }
  setContentView(layout) {
    if (!layout) return;
    if (layout instanceof HTMLElement) this.container.appendChild(layout);
    else if (typeof layout === "string") this.container.innerHTML = layout;
    else this.container.innerHTML = "";
    Object.assign(this.container.style, {
      padding: "20px"
    });
  }
  showDragHandle(flag) {
    if (flag && !this.dragHandleView) {
      this.dragHandleView = document.createElement("div");
      Object.assign(this.dragHandleView.style, {
        width: "100%",
        padding: "15px",
        boxSizing: "border-box",
        position: "sticky",
        top: "0",
        display: "flex",
        justifyContent: "center",
        zIndex: "9998"
      });
      this.dragHandle = document.createElement("div");
      Object.assign(this.dragHandle.style, {
        width: "40px",
        height: "5px",
        borderRadius: "100px",
        cursor: "grab"
      });
      this.dragHandleView.appendChild(this.dragHandle);
      this.dragHandle.addEventListener("mousedown", this.startDrag.bind(this));
      this.dragHandle.addEventListener("touchstart", this.startDrag.bind(this), { passive: false });
      if (this.sheet.firstChild) this.sheet.insertBefore(this.dragHandleView, this.sheet.firstChild);
    } else if (!flag && this.dragHandleView) {
      this.dragHandleView.remove();
    }
  }
  setTheme(theme) {
    this.theme = theme;
  }
  getTheme() {
    if (this.theme instanceof Function) return this.theme(this);
    else if (this.theme instanceof Object) return this.theme;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const isDark = media.matches;
    if (!this.systemThemeListenerAdded) {
      media.addEventListener("change", () => {
        if (!(this.theme instanceof Function) && !(this.theme instanceof Object)) {
          this.applyTheme();
        }
      });
      this.systemThemeListenerAdded = true;
    }
    if (isDark) {
      return {
        backdropColor: "rgba(0, 0, 0, 0.6)",
        boxShadow: "0px -2px 8px rgba(0,0,0,0.8), 0px -6px 20px rgba(0,0,0,0.6)",
        backgroundColor: "rgba(42, 45, 54, 1)",
        dragHandleColor: "rgba(255, 255, 255, 0.3)"
      };
    } else {
      return {
        backdropColor: "rgba(0, 0, 0, 0.4)",
        boxShadow: "0px -2px 8px rgba(0,0,0,0.2), 0px -6px 20px rgba(0,0,0,0.15)",
        backgroundColor: "rgba(255, 255, 255, 1)",
        dragHandleColor: "rgba(0, 0, 0, 0.3)"
      };
    }
  }
  applyTheme() {
    const theme = this.getTheme();
    if (!theme) return;
    Object.assign(this.overlay.style, {
      backgroundColor: theme.backdropColor
    });
    Object.assign(this.sheet.style, {
      boxShadow: theme.boxShadow,
      backgroundColor: theme.backgroundColor
    });
    if (!this.dragHandleView) return;
    Object.assign(this.dragHandleView.style, {
      backgroundColor: theme.backgroundColor
    });
    Object.assign(this.dragHandle.style, {
      backgroundColor: theme.dragHandleColor
    });
  }
  setCancelable(flag) {
    this.cancelable = flag;
  }
  setOnShowListener(callback) {
    this.onShowListener = callback;
  }
  setOnDismissListener(callback) {
    this.onDismissListener = callback;
  }
  show() {
    this.applyTheme();
    Object.assign(document.body.style, { overflow: "hidden" });
    if (this.dragHandleView) Object.assign(this.container.style, { padding: "0px 20px 20px 20px" });
    this.overlay.style.opacity = "1";
    this.overlay.style.pointerEvents = "auto";
    requestAnimationFrame(() => {
      if (this.sheet) this.sheet.style.bottom = "0";
      if (this.onShowListener) this.onShowListener();
    });
  }
  dismiss() {
    Object.assign(document.body.style, { overflow: "hidden" });
    if (this.sheet) this.sheet.style.bottom = "-100%";
    this.overlay.style.opacity = "0";
    this.overlay.style.pointerEvents = "none";
    setTimeout(() => {
      if (this.onDismissListener) this.onDismissListener();
    }, 300);
  }
  startDrag(e) {
    e.preventDefault();
    this.dragging = true;
    this.startY = e.touches ? e.touches[0].clientY : e.clientY;
    this.currentBottom = parseFloat(this.sheet.style.bottom);
    document.addEventListener("mousemove", this.onDrag.bind(this));
    document.addEventListener("mouseup", this.endDrag.bind(this));
    document.addEventListener("touchmove", this.onDrag.bind(this), { passive: false });
    document.addEventListener("touchend", this.endDrag.bind(this));
  }
  onDrag(e) {
    if (!this.dragging) return;
    e.preventDefault();
    const currentY = e.touches ? e.touches[0].clientY : e.clientY;
    let delta = this.startY - currentY;
    let bottom = Math.min(0, this.currentBottom + delta);
    this.sheet.style.bottom = bottom + "px";
  }
  endDrag(e) {
    if (!this.dragging) return;
    this.dragging = false;
    const currentBottom = parseFloat(this.sheet.style.bottom);
    const threshold = -this.sheet.offsetHeight / 3;
    if (currentBottom < threshold) this.dismiss();
    else this.sheet.style.bottom = "0";
    document.removeEventListener("mousemove", this.boundOnDrag);
    document.removeEventListener("mouseup", this.boundEndDrag);
    document.removeEventListener("touchmove", this.boundOnDrag);
    document.removeEventListener("touchend", this.boundEndDrag);
  }
}
