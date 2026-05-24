interface IconProps {
  name: string;
  alt: string;
  size?: number;
  className?: string;
}

export function Icon({ name, alt, size = 22, className }: IconProps) {
  return (
    <img
      src={`/symbols/${name}`}
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}
