const MENU_DATA = {
  beef: {
    label: "Beef Burger",
    icon: "🍔",
    items: [
      {
        name: "Cheesy Buffalo",
        price: "10,50€",
        description:
          "Brioche Bun, Hausgemachte Beef Patty 140g, Käse, Burger Sauce, Gurke, Zwiebel, Tomaten, Salat",
        spiceLevel: 3,
        image: "https://foodiewagon.de/burgers/beef/Cheesy-Buffalo_10,50euros.webp",
      },
      {
        name: "Angry Bull",
        price: "12,00€",
        description:
          "Brioche Bun, Hausgemachte Beef Patty 140g, Käse, Chili Cheese Sauce, Jalapeno, Gurke, Zwiebel, Salat",
        spiceLevel: 3,
        image: "https://foodiewagon.de/burgers/beef/Angry-Bull_12euros.webp",
      },
      {
        name: "Smokie Beefy BBQ",
        price: "13,00€",
        description:
          "Brioche Bun, Hausgemachte Beef Patty 140g, Käse, Burger Sauce, Gurke, Onion Rings, Geröstete Zwiebel, BBQ Sauce, Tomaten, Salat",
        spiceLevel: 3,
        image: "https://foodiewagon.de/burgers/beef/Smookie-Beefy-BBQ_13euros.webp",
      },
      {
        name: "Blazing Nacho Beef",
        price: "13,00€",
        description:
          "Brioche Bun, Hausgemachte Beef Patty 140g, Käse, Burger Sauce, Gurke, Jalapeno, Nachos, Sriracha Sauce, Tomaten, Salat",
        spiceLevel: 3,
        image: "https://foodiewagon.de/burgers/beef/Blazing-Nacho-Beef_13euros.webp",
      },
      {
        name: "Cheese Burger",
        price: "7,00€",
        description:
          "Brioche Bun, Hausgemachte Beef Patty 140g, Käse, Burger Sauce, Gurke, Zwiebel, Tomaten, Salat",
        spiceLevel: 1,
        image: "https://foodiewagon.de/burgers/beef/Cheese-Burger_7euros.webp",
      },
    ],
  },
  chicken: {
    label: "Chicken Burger",
    icon: "🔥",
    items: [
      {
        name: "Crunchy Chicken",
        price: "8,50€",
        description: "Brioche Bun, Chicken Strips, Käse, Burger Sauce, Salat",
        spiceLevel: 2,
        image: "https://foodiewagon.de/burgers/chicken/Chrunchy-Chicken_8,50euros.webp",
      },
      {
        name: "Loaded Crunchy",
        price: "9,00€",
        description: "Brioche Bun, Chicken Strips, Käse, Burger Sauce, Tomaten, Zwiebel, Gurke, Salat",
        spiceLevel: 2,
        image: "https://foodiewagon.de/burgers/chicken/Loaded-Chrunchy_9euros.webp",
      },
      {
        name: "Crispy Ringer",
        price: "10,00€",
        description: "Brioche Bun, Chicken Strips, Käse, Burger Sauce, Onion Rings, Zwiebel, Tomaten, Salat",
        spiceLevel: 2,
        image: "https://foodiewagon.de/burgers/chicken/Crispy-Ringer_10euros.webp",
      },
      {
        name: "Mexican Cracker",
        price: "11,00€",
        description:
          "Brioche Bun, Chicken Strips, Käse, Burger Sauce, Jalapeno, Gurke, Nachos, Sriracha Sauce, Zwiebel, Salat",
        spiceLevel: 2,
        image: "https://foodiewagon.de/burgers/chicken/Mexican-Cracker_11euros.webp",
      },
      {
        name: "Flip Chicken Burger",
        price: "6,00€",
        description: "Brioche Bun, Chicken Strips, Käse, Burger Sauce, Salat",
        spiceLevel: 1,
        image: "https://foodiewagon.de/burgers/chicken/Flip-Chicken-Burger_6euros.webp",
      },
      {
        name: "Foodie Bomber",
        price: "13,00€",
        description:
          "Brioche Bun, Chicken Strips, Käse, Chili Cheese Nuggets, Chili Cheese Sauce, Zwiebel, Jalapeno, Salat",
        spiceLevel: 2,
        image: "https://foodiewagon.de/burgers/chicken/Foodie-Bomber-13euros.webp",
      },
    ],
  },
  veggie: {
    label: "Veggie",
    icon: "🥬",
    items: [
      {
        name: "Plant Power",
        price: "9,00€",
        description: "Brioche Bun, Falafel, Käse, Burger Sauce, Gurke, Salat, Zwiebel, Tomaten",
        spiceLevel: 0,
        image: null,
      },
      {
        name: "Veggie BBQ",
        price: "11,00€",
        description:
          "Brioche Bun, Falafel, Käse, Burger Sauce, Gurke, Onion Rings, Geröstete Zwiebel, BBQ Sauce, Tomaten, Salat",
        spiceLevel: 0,
        image: null,
      },
    ],
  },
  drinks: {
    label: "Getränke",
    icon: "🥤",
    items: [
      {
        name: "Coca Cola",
        price: "2,50€",
        description: "330ml Dose",
        image: "https://foodiewagon.de/graphics/cold%20drinks%20sprite%20cola%20fanta.svg",
      },
      {
        name: "Coca Cola Zero",
        price: "2,50€",
        description: "330ml Dose",
        image: "https://foodiewagon.de/graphics/cold%20drinks%20sprite%20cola%20fanta.svg",
      },
      { name: "Fanta", price: "2,50€", description: "330ml Dose", image: "https://foodiewagon.de/graphics/cold%20drinks%20sprite%20cola%20fanta.svg" },
      { name: "Sprite", price: "2,50€", description: "330ml Dose", image: "https://foodiewagon.de/graphics/cold%20drinks%20sprite%20cola%20fanta.svg" },
      { name: "Capri Sonne", price: "1,50€", description: "200ml", image: "https://foodiewagon.de/graphics/caprisun.svg" },
      { name: "Wasser", price: "2,00€", description: "500ml", image: "https://foodiewagon.de/graphics/water.svg" },
      { name: "Mezzo Mix", price: "2,50€", description: "330ml Dose", image: "https://foodiewagon.de/graphics/cold%20drinks%20sprite%20cola%20fanta.svg" },
      { name: "Red Bull", price: "3,50€", description: "250ml Dose", image: "https://foodiewagon.de/graphics/redbull.svg" },
    ],
  },
}

function $(selector, root = document) {
  return root.querySelector(selector)
}

function $all(selector, root = document) {
  return Array.from(root.querySelectorAll(selector))
}

function initFooterYear() {
  const yearEl = document.querySelector("[data-year]")
  if (yearEl) yearEl.textContent = String(new Date().getFullYear())
}

function initMobileMenu() {
  const toggle = $("[data-menu-toggle]")
  const mobileNav = $("[data-mobile-nav]")
  if (!toggle || !mobileNav) return

  const closeLinks = $all("[data-close-menu]", mobileNav)

  const setOpen = (open) => {
    toggle.classList.toggle("is-open", open)
    toggle.setAttribute("aria-expanded", open ? "true" : "false")
    mobileNav.hidden = !open
  }

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true"
    setOpen(!isOpen)
  })

  closeLinks.forEach((link) => {
    link.addEventListener("click", () => setOpen(false))
  })

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false)
  })

  // Ensure mobile nav cannot remain open on desktop
  const BREAKPOINT = 900
  const handleResize = () => {
    if (window.innerWidth >= BREAKPOINT) {
      setOpen(false)
    }
  }
  window.addEventListener("resize", handleResize)
  handleResize()
}

function renderTabs(activeKey) {
  const tabsRoot = $("[data-menu-tabs]")
  if (!tabsRoot) return

  tabsRoot.innerHTML = ""

  Object.entries(MENU_DATA).forEach(([key, meta]) => {
    const btn = document.createElement("button")
    btn.type = "button"
    btn.className = "tab"
    btn.setAttribute("role", "tab")
    btn.setAttribute("aria-selected", key === activeKey ? "true" : "false")
    btn.dataset.key = key

    const icon = document.createElement("span")
    icon.className = "tab__icon"
    icon.textContent = meta.icon

    const label = document.createElement("span")
    label.textContent = meta.label

    btn.append(icon, label)

    btn.addEventListener("click", () => {
      setActiveCategory(key)
    })

    tabsRoot.appendChild(btn)
  })
}

function renderMenuItems(activeKey) {
  const grid = $("[data-menu-grid]")
  if (!grid) return

  const { items } = MENU_DATA[activeKey]
  grid.setAttribute("aria-busy", "true")
  grid.innerHTML = ""

  items.forEach((item) => {
    const article = document.createElement("article")
    article.className = "menu-item"

    const media = document.createElement("div")
    media.className = "menu-item__media"

    if (item.image) {
      const img = document.createElement("img")
      img.className = "menu-item__img"
      img.src = item.image
      img.alt = item.name
      img.loading = "lazy"
      media.appendChild(img)

      const price = document.createElement("div")
      price.className = "menu-item__price"
      price.textContent = item.price
      media.appendChild(price)

      const halal = document.createElement("img")
      halal.className = "menu-item__halal"
      halal.src = "https://foodiewagon.de/graphics/halal%20logo.svg"
      halal.alt = "100% Halal"
      halal.loading = "lazy"
      media.appendChild(halal)
    } else {
      const placeholder = document.createElement("div")
      placeholder.style.padding = "24px"
      placeholder.style.textAlign = "center"
      placeholder.style.color = "rgba(244, 240, 230, 0.65)"
      placeholder.textContent = "Bild folgt"
      media.appendChild(placeholder)

      const price = document.createElement("div")
      price.className = "menu-item__price"
      price.textContent = item.price
      media.appendChild(price)

      const halal = document.createElement("img")
      halal.className = "menu-item__halal"
      halal.src = "https://foodiewagon.de/graphics/halal%20logo.svg"
      halal.alt = "100% Halal"
      halal.loading = "lazy"
      media.appendChild(halal)
    }

    const body = document.createElement("div")
    body.className = "menu-item__body"

    const name = document.createElement("h3")
    name.className = "menu-item__name"
    name.textContent = item.name

    const desc = document.createElement("p")
    desc.className = "menu-item__desc"
    desc.textContent = item.description

    body.append(name, desc)

    if (typeof item.spiceLevel === "number" && item.spiceLevel > 0) {
      const spice = document.createElement("div")
      spice.className = "menu-item__spice"

      for (let i = 0; i < 3; i += 1) {
        const flame = document.createElement("span")
        flame.className = "flame" + (i < item.spiceLevel ? " is-hot" : "")
        flame.textContent = "🔥"
        spice.appendChild(flame)
      }

      body.appendChild(spice)
    }

    article.append(media, body)
    grid.appendChild(article)
  })

  grid.setAttribute("aria-busy", "false")
}

let ACTIVE_CATEGORY = "beef"

function setActiveCategory(key) {
  ACTIVE_CATEGORY = key
  renderTabs(ACTIVE_CATEGORY)
  renderMenuItems(ACTIVE_CATEGORY)
}

function initStickyCTA() {
  const sticky = $("[data-sticky-cta]")
  if (!sticky) return

  const update = () => {
    const show = window.scrollY > 300
    sticky.classList.toggle("is-visible", show)
    sticky.setAttribute("aria-hidden", show ? "false" : "true")
  }

  window.addEventListener("scroll", update, { passive: true })
  update()
}

function initAnchorOffsets() {
  // Ensures fixed header doesn't cover anchored sections
  const header = $("[data-header]")
  if (!header) return

  const setOffset = () => {
    document.documentElement.style.scrollPaddingTop = `${header.offsetHeight + 12}px`
  }

  window.addEventListener("resize", setOffset)
  setOffset()
}

function init() {
  initFooterYear()
  initMobileMenu()
  initStickyCTA()
  initAnchorOffsets()

  setActiveCategory(ACTIVE_CATEGORY)
}

init()
