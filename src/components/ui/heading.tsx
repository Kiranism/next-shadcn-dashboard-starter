interface HeadingProps {
  title: string;
  description?: string;
}

export const Heading: React.FC<HeadingProps> = ({ title, description }) => {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
      {description && <p className="text-gray-500">{description}</p>}
    </div>
  );
};
