# Abhishek Kumar Mehta Portfolio

A high-performance, responsive personal developer portfolio website for **Abhishek Kumar Mehta**. It features a modern dark navy theme with purple-cyan gradient accents, an interactive particle background, filterable project showcase, categorized technical skills, education timeline, and client-side contact validation.

## 🚀 Key Features
- **Zero Cost & Zero External Dependencies**: 100% pure HTML5, CSS3, and modern vanilla JavaScript. No paid APIs, CDNs, or runtime libraries.
- **Dynamic Data Configuration**: All content (education, skills, projects, experience, achievements, services, social links) is cleanly managed in `data.js`.
- **Project Filtering**: Instant, client-side category filters (`All Projects`, `Web Development`, `Programming`, `Creative & Media`).
- **Interactive Background**: Custom HTML5 Canvas particle network with dynamic connecting nodes.
- **Transparent Contact Form**: Client-side validation with explicit demo status messaging and one-click direct links (Email and WhatsApp) so visitors can contact you directly without needing an expensive backend server.
- **Fully Responsive**: Optimized for desktop, tablet, and mobile screens with an accessible collapsible navigation menu.
- **Reliable Asset Fallbacks**: Automatic SVG fallback avatars and project illustrations when personal images are loading or absent.

## 📁 File Structure
```
portfolio/
├── index.html                 # Semantic HTML5 layout and sections
├── style.css                  # Dark design system, glassmorphism, responsive styles
├── script.js                  # Particle canvas, project filtering, observers & form validation
├── data.js                    # Easy-to-edit personal data and project details
├── README.md                  # Project documentation and instructions
└── assets/
    ├── placeholder.svg        # Clean vector fallback for profile portrait
    ├── project-placeholder.svg# Clean vector fallback for project cards
    ├── profile.jpg            # (Optional) Add your personal photo here
    └── resume.pdf             # (Optional) Add your resume PDF here
```

## 🛠️ How to Open & Test Locally
1. Navigate to the project directory:
   ```
   C:\Users\ADMIN1\Desktop\portfolio
   ```
2. Double-click **`index.html`** or right-click it and choose **Open with > Google Chrome** (or any modern web browser).
3. The portfolio will load immediately offline without requiring a local server.

## ✏️ How to Personalize Your Content
All personal information is centralized in `data.js`:
- Open `data.js` in any text editor.
- Update your **name**, **professions**, **bio**, **education**, and **skills**.
- Add your real projects with title, category, description, and link.
- To update your profile photo, place an image named `profile.jpg` in the `assets/` folder.
- To provide your resume, place your PDF named `resume.pdf` in the `assets/` folder.

## 🌐 Free Deployment via GitHub Pages
When you are ready to publish the portfolio online for free:
1. Create a free account on [GitHub](https://github.com) if you haven't already.
2. Create a new public repository (e.g. `abhishek-portfolio`).
3. Upload all files from this directory to the repository.
4. Go to **Settings > Pages** in your repository.
5. Under **Branch**, select `main` (or `master`) and folder `/(root)`, then click **Save**.
6. GitHub will generate a live URL (e.g. `https://<your-username>.github.io/abhishek-portfolio/`).
