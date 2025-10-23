import { useState } from 'react';

export default function ImageWithFallback({ src, fallback, alt, ...props }) {
  const [error, setError] = useState(false);

  return (
    <img
      src={error ? fallback : src}
      alt={alt}
      onError={() => setError(true)}
      {...props}
    />
  );
}
