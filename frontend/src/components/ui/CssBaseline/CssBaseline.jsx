import React from 'react'
import {createGlobalStyle} from 'styled-components'
import {colors, typography} from '@/styles'

// Global CSS reset and base styles
const GlobalStyles = createGlobalStyle`
  /* Modern CSS reset */
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* Remove default margins and paddings */
  html,
  body,
  div,
  span,
  applet,
  object,
  iframe,
  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  p,
  blockquote,
  pre,
  a,
  abbr,
  acronym,
  address,
  big,
  cite,
  code,
  del,
  dfn,
  em,
  img,
  ins,
  kbd,
  q,
  s,
  samp,
  small,
  strike,
  strong,
  sub,
  sup,
  tt,
  var,
  b,
  u,
  i,
  center,
  dl,
  dt,
  dd,
  ol,
  ul,
  li,
  fieldset,
  form,
  label,
  legend,
  table,
  caption,
  tbody,
  tfoot,
  thead,
  tr,
  th,
  td,
  article,
  aside,
  canvas,
  details,
  embed,
  figure,
  figcaption,
  footer,
  header,
  hgroup,
  menu,
  nav,
  output,
  ruby,
  section,
  summary,
  time,
  mark,
  audio,
  video {
    margin: 0;
    padding: 0;
    border: 0;
    font-size: 100%;
    font: inherit;
    vertical-align: baseline;
  }

  /* HTML5 display-role reset for older browsers */
  article,
  aside,
  details,
  figcaption,
  figure,
  footer,
  header,
  hgroup,
  menu,
  nav,
  section {
    display: block;
  }

  /* Root element */
  html {
    font-size: 16px;
    line-height: 1.5;
    -webkit-text-size-adjust: 100%;
    -webkit-tap-highlight-color: transparent;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Body */
  body {
    font-family: ${typography.fontFamily.primary};
    font-size: ${typography.fontSize.base};
    font-weight: ${typography.fontWeight.normal};
    line-height: ${typography.lineHeight.relaxed};
    color: ${colors.text.primary};
    background-color: ${colors.surface.primary};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
  }

  /* Lists */
  ol,
  ul {
    list-style: none;
  }

  /* Quotes */
  blockquote,
  q {
    quotes: none;
  }

  blockquote:before,
  blockquote:after,
  q:before,
  q:after {
    content: '';
    content: none;
  }

  /* Tables */
  table {
    border-collapse: collapse;
    border-spacing: 0;
  }

  /* Links */
  a {
    color: ${colors.primary.main};
    text-decoration: none;
    background-color: transparent;
  }

  a:hover,
  a:focus {
    text-decoration: underline;
    color: ${colors.primary.dark};
  }

  /* Images */
  img {
    max-width: 100%;
    height: auto;
    border-style: none;
  }

  /* Forms */
  button,
  input,
  optgroup,
  select,
  textarea {
    font-family: inherit;
    font-size: 100%;
    line-height: 1.15;
    margin: 0;
  }

  button,
  input {
    overflow: visible;
  }

  button,
  select {
    text-transform: none;
  }

  button,
  [type="button"],
  [type="reset"],
  [type="submit"] {
    -webkit-appearance: button;
    cursor: pointer;
  }

  button::-moz-focus-inner,
  [type="button"]::-moz-focus-inner,
  [type="reset"]::-moz-focus-inner,
  [type="submit"]::-moz-focus-inner {
    border-style: none;
    padding: 0;
  }

  button:-moz-focusring,
  [type="button"]:-moz-focusring,
  [type="reset"]:-moz-focusring,
  [type="submit"]:-moz-focusring {
    outline: 1px dotted ButtonText;
  }

  /* Input fields */
  input,
  textarea {
    background-color: transparent;
    border: none;
    outline: none;
  }

  /* Remove Chrome autofill background */
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  textarea:-webkit-autofill,
  textarea:-webkit-autofill:hover,
  textarea:-webkit-autofill:focus,
  select:-webkit-autofill,
  select:-webkit-autofill:hover,
  select:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0px 1000px transparent inset !important;
    transition: background-color 5000s ease-in-out 0s;
  }

  /* Typography */
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-weight: ${typography.fontWeight.semiBold};
    line-height: ${typography.lineHeight.tight};
    color: ${colors.text.primary};
  }

  h1 {
    font-size: ${typography.fontSize['2xl']};
  }

  h2 {
    font-size: ${typography.fontSize.xl};
  }

  h3 {
    font-size: ${typography.fontSize.lg};
  }

  h4 {
    font-size: ${typography.fontSize.base};
  }

  h5 {
    font-size: ${typography.fontSize.sm};
  }

  h6 {
    font-size: ${typography.fontSize.xs};
  }

  p {
    margin-bottom: 1em;
  }

  /* Code */
  code,
  kbd,
  samp {
    font-family: ${typography.fontFamily.mono};
    font-size: 1em;
  }

  /* Selection */
  ::selection {
    background-color: ${colors.primary.main}40;
    color: ${colors.text.primary};
  }

  ::-moz-selection {
    background-color: ${colors.primary.main}40;
    color: ${colors.text.primary};
  }

  /* Focus styles */
  :focus {
    outline: 2px solid ${colors.primary.main};
    outline-offset: 2px;
  }

  :focus:not(:focus-visible) {
    outline: none;
  }

  :focus-visible {
    outline: 2px solid ${colors.primary.main};
    outline-offset: 2px;
  }

  /* Scrollbars */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${colors.surface.secondary};
  }

  ::-webkit-scrollbar-thumb {
    background: ${colors.grey[400]};
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${colors.grey[500]};
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  /* High contrast mode support */
  @media (prefers-color-scheme: dark) {
    /* Dark mode adjustments would go here */
  }

  /* Print styles */
  @media print {
    *,
    *::before,
    *::after {
      background: transparent !important;
      color: #000 !important;
      box-shadow: none !important;
      text-shadow: none !important;
    }

    a,
    a:visited {
      text-decoration: underline;
    }

    a[href]::after {
      content: " (" attr(href) ")";
    }

    abbr[title]::after {
      content: " (" attr(title) ")";
    }

    a[href^="#"]::after,
    a[href^="javascript:"]::after {
      content: "";
    }

    pre {
      white-space: pre-wrap !important;
    }

    pre,
    blockquote {
      border: 1px solid #999;
      page-break-inside: avoid;
    }

    thead {
      display: table-header-group;
    }

    tr,
    img {
      page-break-inside: avoid;
    }

    p,
    h2,
    h3 {
      orphans: 3;
      widows: 3;
    }

    h2,
    h3 {
      page-break-after: avoid;
    }
  }
`

const CssBaseline = ({ children }) => {
  return (
    <>
      <GlobalStyles />
      {children}
    </>
  )
}

export default CssBaseline