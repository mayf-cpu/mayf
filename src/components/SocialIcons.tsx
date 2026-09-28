import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

// 1. Official YouTube Icon (Red rounded rectangle with white triangle)
export const YouTubeIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    style={size ? { width: size, height: size } : undefined}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
      fill="#FF0000"
    />
    <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FFFFFF" />
  </svg>
);

// 2. Official WhatsApp Icon (Green circle with phone receiver inside chat bubble)
export const WhatsAppIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    style={size ? { width: size, height: size } : undefined}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.979-.276-.1-.476-.15-.677.15-.2.301-.777.979-.953 1.18-.175.2-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.895-.798-1.5-1.784-1.675-2.085-.176-.301-.019-.464.132-.614.136-.135.301-.351.451-.527.151-.175.201-.301.302-.501.1-.2.05-.376-.025-.526-.075-.15-.677-1.633-.928-2.235-.244-.587-.493-.507-.677-.517-.175-.009-.376-.011-.577-.011-.2 0-.526.075-.802.376-.276.301-1.053 1.029-1.053 2.509 0 1.48 1.078 2.909 1.229 3.11.15.2 2.122 3.24 5.141 4.544.718.31 1.279.496 1.716.635.722.23 1.38.197 1.9.12.58-.087 1.78-.728 2.03-1.43.251-.703.251-1.305.176-1.431-.076-.126-.276-.201-.577-.351z"
      fill="#FFFFFF"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.98-1.405A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.25a8.212 8.212 0 0 1-4.328-1.224l-.31-.188-2.957.834.85-2.882-.206-.328A8.204 8.204 0 0 1 3.75 12c0-4.556 3.694-8.25 8.25-8.25 4.556 0 8.25 3.694 8.25 8.25 0 4.556-3.694 8.25-8.25 8.25z"
      fill="#25D366"
    />
    <circle cx="12" cy="12" r="9" fill="#25D366" />
    <path
      d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.979-.276-.1-.476-.15-.677.15-.2.301-.777.979-.953 1.18-.175.2-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.895-.798-1.5-1.784-1.675-2.085-.176-.301-.019-.464.132-.614.136-.135.301-.351.451-.527.151-.175.201-.301.302-.501.1-.2.05-.376-.025-.526-.075-.15-.677-1.633-.928-2.235-.244-.587-.493-.507-.677-.517-.175-.009-.376-.011-.577-.011-.2 0-.526.075-.802.376-.276.301-1.053 1.029-1.053 2.509 0 1.48 1.078 2.909 1.229 3.11.15.2 2.122 3.24 5.141 4.544.718.31 1.279.496 1.716.635.722.23 1.38.197 1.9.12.58-.087 1.78-.728 2.03-1.43.251-.703.251-1.305.176-1.431-.076-.126-.276-.201-.577-.351z"
      fill="#FFFFFF"
    />
  </svg>
);

// 3. Official Telegram Icon (Sky blue circle with white paper plane)
export const TelegramIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    style={size ? { width: size, height: size } : undefined}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="12" fill="#229ED9" />
    <path
      d="M17.84 6.74c.2-.9-.55-1.5-1.3-.17L3.94 11.45c-.8.3-.8.8-.15 1l3.2 1 7.4-4.7c.35-.2.68-.1.42.14l-6 5.4-.24 3.4c.36 0 .52-.16.72-.36l1.7-1.65 3.5 2.6c.65.36 1.1.18 1.28-.6l2.07-9.54z"
      fill="#FFFFFF"
    />
  </svg>
);

// 4. Official Facebook Icon (Blue circle with white bold 'f')
export const FacebookIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    style={size ? { width: size, height: size } : undefined}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      fill="#1877F2"
    />
    <path
      d="M16.671 15.543l.532-3.47h-3.328v-2.25c0-.949.465-1.874 1.956-1.874h1.514V4.996s-1.374-.235-2.686-.235c-2.741 0-4.533 1.662-4.533 4.669v2.643H7.078v3.47h3.047v8.385a12.09 12.09 0 0 0 3.75 0v-8.385h2.796z"
      fill="#FFFFFF"
    />
  </svg>
);

// 5. Official Instagram Icon (Vibrant gradient camera logo)
export const InstagramIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    style={size ? { width: size, height: size } : undefined}
    xmlns="http://www.w3.org/2000/svg"
  >
    <radialGradient id="ig-grad" cx="20%" cy="110%" r="130%">
      <stop offset="0%" stopColor="#fdf497" />
      <stop offset="5%" stopColor="#fdf497" />
      <stop offset="45%" stopColor="#fd5949" />
      <stop offset="60%" stopColor="#d6249f" />
      <stop offset="90%" stopColor="#285AEB" />
    </radialGradient>
    <rect width="24" height="24" rx="6" fill="url(#ig-grad)" />
    <path
      d="M12 7.03a4.97 4.97 0 1 0 0 9.94 4.97 4.97 0 0 0 0-9.94zm0 8.2a3.23 3.23 0 1 1 0-6.46 3.23 3.23 0 0 1 0 6.46zm6.33-8.37a1.16 1.16 0 1 1-2.32 0 1.16 1.16 0 0 1 2.32 0zm2.6 2.62c-.06-1.26-.35-2.38-1.27-3.3-.92-.92-2.04-1.21-3.3-1.27C15.03 4.9 14.65 4.9 12 4.9s-3.03 0-4.36.06c-1.26.06-2.38.35-3.3 1.27-.92.92-1.21 2.04-1.27 3.3C3 10.97 3 11.35 3 14s0 3.03.06 4.36c.06 1.26.35 2.38 1.27 3.3.92.92 2.04 1.21 3.3 1.27 1.33.06 1.71.06 4.37.06s3.03 0 4.36-.06c1.26-.06 2.38-.35 3.3-1.27.92-.92 1.21-2.04 1.27-3.3.06-1.33.06-1.71.06-4.36s0-3.03-.06-4.36zm-2.07 10.15c-.27.7-.82 1.24-1.52 1.52-1.07.42-3.6.32-5.34.32s-4.28.1-5.34-.32c-.7-.28-1.25-.82-1.52-1.52-.42-1.07-.32-3.6-.32-5.34s-.1-4.28.32-5.34c.27-.7.82-1.24 1.52-1.52 1.07-.42 3.6-.32 5.34-.32s4.28-.1 5.34.32c.7.28 1.25.82 1.52 1.52.42 1.07.32 3.6.32 5.34s.1 4.28-.32 5.34z"
      fill="#FFFFFF"
    />
  </svg>
);

// 6. Official Google Chrome Icon (4-color red-yellow-green circle with blue center)
export const ChromeIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    style={size ? { width: size, height: size } : undefined}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="10" fill="#EA4335" />
    <path
      d="M12 2a10 10 0 0 1 8.66 5H12l-2.6 4.5L5.7 5.7A9.97 9.97 0 0 1 12 2z"
      fill="#EA4335"
    />
    <path
      d="M20.66 7A10 10 0 0 1 17 20.66L13.5 14.5l2.6-4.5h4.56z"
      fill="#FBBC05"
    />
    <path
      d="M17 20.66A10 10 0 0 1 3.34 7L6.84 13l2.56 4.4L17 20.66z"
      fill="#34A853"
    />
    <circle cx="12" cy="12" r="4.5" fill="#FFFFFF" />
    <circle cx="12" cy="12" r="3.6" fill="#4285F4" />
  </svg>
);

// 7. Official X / Twitter Icon
export const XTwitterIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    style={size ? { width: size, height: size } : undefined}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="24" height="24" rx="5" fill="#000000" />
    <path
      d="M18.244 4h2.208l-4.825 5.513L21.3 19h-4.444l-3.48-4.551L9.39 19H7.18l5.16-5.897L7 4h4.557l3.146 4.159L18.244 4zm-.775 13.676h1.223L8.625 5.26H7.312l10.157 12.416z"
      fill="#FFFFFF"
    />
  </svg>
);

// 8. Official LinkedIn Icon
export const LinkedInIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    style={size ? { width: size, height: size } : undefined}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="24" height="24" rx="4" fill="#0A66C2" />
    <path
      d="M6.94 5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM4.14 7.64H6.8V17H4.14V7.64zm4.27 0h2.55v1.28h.04c.36-.68 1.23-1.4 2.54-1.4 2.72 0 3.22 1.79 3.22 4.12V17h-2.66v-4.75c0-1.13-.02-2.59-1.58-2.59-1.58 0-1.82 1.23-1.82 2.51V17H8.41V7.64z"
      fill="#FFFFFF"
    />
  </svg>
);
