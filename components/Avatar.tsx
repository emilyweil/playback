type Props = {
  avatarUrl?: string | null;
  name: string;
  size?: number;
};

export default function Avatar({ avatarUrl, name, size = 36 }: Props) {
  return (
    <div
      className="flex-shrink-0 overflow-hidden rounded-full bg-raised"
      style={{ width: size, height: size }}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-display text-xs text-slate">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}
