# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static website for Nero (네로), a mental health data company. The site is built using HTML, CSS, and JavaScript with Bootstrap framework and is deployed on Netlify.

## Technology Stack

- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Framework**: Bootstrap 5.2.3 (via CDN)
- **Template**: Start Bootstrap Agency v7.0.12
- **Icons**: Font Awesome 6.3.0
- **Fonts**: Google Fonts (Montserrat, Roboto Slab)
- **Deployment**: Netlify

## File Structure

```
/
├── index.html          # Main homepage
├── services.html       # Services page
├── css/
│   └── styles.css      # Main stylesheet (Bootstrap + custom styles)
├── js/
│   └── scripts.js      # JavaScript functionality
├── assets/
│   ├── favicon.ico
│   └── img/           # All images organized by section
│       ├── about/     # About section images
│       ├── logos/     # Partner/client logos
│       ├── portfolio/ # Portfolio item images
│       └── services/  # Service-related images
└── netlify.toml       # Netlify deployment configuration
```

## Development Commands

This is a static website with no build process. To develop:

1. **Local Development**: Use any local server (e.g., `python -m http.server`, Live Server extension)
2. **Deployment**: Automatic via Netlify when pushed to main branch

## Key Architecture Notes

### Page Structure
- **index.html**: Single-page application with sections for Portfolio, About, and Contact
- **services.html**: Dedicated services page showcasing Nero's offerings
- Both pages share the same navigation structure and styling

### Styling Approach
- Built on Bootstrap Agency template with custom modifications
- CSS variables used for theming (defined in styles.css)
- Dark theme implementation for services page
- Responsive design using Bootstrap grid system

### JavaScript Functionality
- Navbar shrinking on scroll
- Bootstrap modal functionality for portfolio items
- Smooth scrolling navigation
- Form handling via Start Bootstrap forms service

### Missing Files
- `css/custom.css` is referenced in services.html but doesn't exist
- Some navigation links reference non-existent pages (invest.html)

## Content Sections

### Main Page (index.html)
- Hero section with company mission
- Portfolio showcase (3 items with modals)
- About section with company information
- Contact form

### Services Page (services.html)
- Service descriptions and features
- App store download links
- Dark-themed design

## Development Guidelines

1. **Responsive Design**: Ensure all changes work across desktop, tablet, and mobile
2. **Consistency**: Maintain visual consistency between pages
3. **Performance**: Optimize images and minimize external dependencies
4. **Accessibility**: Follow WCAG guidelines for accessibility
5. **Korean Content**: Handle Korean text properly in all sections

## Common Tasks

- **Adding new images**: Place in appropriate `assets/img/` subdirectory
- **Modifying styles**: Edit `css/styles.css` (contains both Bootstrap and custom CSS)
- **Adding new pages**: Follow the same structure as existing HTML files
- **Updating content**: Modify HTML directly (no CMS or build process)