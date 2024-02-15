interface HeadingProps {
  headTitle: string;
  description: string;
}

export const Heading: React.FC<HeadingProps> = ({ headTitle, description }) => {
  return (
    <div>
      <h2 className="text-3xl font-bold tracking-tight">{headTitle}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
};
