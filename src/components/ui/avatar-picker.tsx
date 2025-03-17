'use client';
import { cn, withPrecision } from '@/lib/utils';
import Image from 'next/image';
import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';
import Icons from './icons';
import { SiteConfig } from '@/constants/site-config';
import { toast } from 'sonner';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  placeholderIcon?: React.ReactNode;
  onPick?: (image: File) => void;
  onSizeExceeded?: () => void;
  variant?: 'circle' | 'square' | 'video';
  skeleton?: React.ReactNode;
}

const AvatarPicker = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      placeholderIcon,
      onPick,
      variant = 'circle',
      skeleton,
      onSizeExceeded,
      ...props
    },
    ref
  ) => {
    const [error, setError] = useState<boolean>(false);
    const [selectedImage, setSelectedImage] = useState<File>();
    const [imageURL, setImageURL] = useState<string | undefined>(props.src);

    const handleImageSelect = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
          const mFile = e.target.files[0];
          if (mFile.size > SiteConfig.featureFlags.maxFileSize) {
            toast.warning(
              `Selected file exceeds the ${withPrecision({
                num: SiteConfig.featureFlags.maxFileSize / 1e6
              })} MB limit. Current file size: ${withPrecision({
                num: mFile.size / 1e6
              })} MB. Please select a file within the limit.`
            );
            if (onSizeExceeded) onSizeExceeded();
            return;
          }

          setSelectedImage(mFile);
          setImageURL(URL.createObjectURL(mFile));
          setError(false);

          if (onPick) onPick(mFile);
        }
      },
      [onPick, onSizeExceeded]
    );

    const inputRef: React.Ref<HTMLInputElement> | undefined = useRef(null);

    useEffect(() => {
      setError(false);
    }, [props.src]);

    return (
      <div
        onClick={() => {
          if (props.disabled || props.readOnly) return;

          if (inputRef && inputRef.current) {
            inputRef.current.click();
          }
        }}
        className={cn(
          'group relative flex size-fit cursor-pointer flex-col items-center justify-center overflow-hidden border bg-background p-2',
          variant === 'video' ? 'aspect-video' : 'aspect-square',
          variant === 'circle' ? 'rounded-full' : 'rounded-md',
          props.disabled || props.readOnly ? 'cursor-pointer' : '',
          className
        )}
      >
        <input
          type='file'
          accept='image/*'
          onChange={handleImageSelect}
          className='hidden'
          ref={inputRef}
          {...props}
        />
        {imageURL && !error ? (
          <Image
            onError={(e) => setError(true)}
            unoptimized
            height={0}
            width={0}
            alt={props.alt ?? 'Avatar preview'}
            placeholder='blur'
            blurDataURL='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAAEQUlEQVR4Xu2cjXHUMBCFkw6gA6cD6CBUQKiAowOogEkF0AHXAaECoALogOsAOoB9gzUYWz+rXd1aPq9mNJdJtLL0+WklrXS5vvKkInCtsnbjKweoFIEDdIBKAkrzGgU+omc9ofxy/BzoE7+7hPSLOoH8nfInykdup7gAb6nCdyM4bt1bLneixt9zQHIAAtzrLdNQtP092b7J2ZcA7hle4PZAP7xIQcwBvCOjj4q3d0mmAAiQi5QCiMnh8458XullY4J5XAPQ1bek9So2qaQUiKELiJ7+EYj6whTAH2Q3OL3/CESHcQrgTzK9lEVySx0seKUA/mY+tbQMYlazejFxfx3g33fnAJUadoAOUElAae4KdIBKAkpzV6ADVBJQmrsC9wbwljo8PVsRnUcooU3NN6NA7K8/UM5FenCwgwDmqSGgUlWbADhQLxCkxWcpQZFPDSFuAiDgYehyExR4wy2sLNc9QGmEOxoFVsKKmXcPUBrhzp6INQTZPUBphDt5mNMQHqriAKw6E+FUiAdzA6rc+mJcuM/QMC21L+lKrAKqUgVaTSQ5gFk/bAUQa7+DQCJr+8DiJGYFEPAAsTbhXgrup5w7xRRYhJfzYSWfEDpU45++kRGux3ETdiTPKGMiOXea95cFzxogtnHwhZzjUkADPEC0SFOAbHjWAPG8gTLWhDklrrkXroK3BsCgJtw3fD6ChCLn0RiLYTtVNhRYDW9NgC2GZYjsoONa4Aeq4yhplNUsLGlbzmYaFsOQR+RmlbRVgPN15Reih0nHPG0RIPwnrh7PE9aL2fvM56C7NYApeIGNaCLQgLUEGPxW8sJ2oSNw9FBeaR2ZvM+sAUW2eHmLXZElwBATlPgrrBsR0S7BC4wwqbRchAflL3hZAZx/XeJIHcRw46RhhIdPbmq5k5m6jVUApvwWx19BcVBezR46QD7RD1CiZo04b7s5wNLQw9IDQzqWpms9rvLm5TRrxNiLNwWIIYcITM5v5YaaNIY4hchReezlpEaNGcCaoYehdjPrRWm5wlFka3h4phnA2lM4DOOwk+gVnhlA6RcUj9TCr5Q5a72cAs+hvPA8EwVyo9kxCPCJ3LVezP6c8MwUqAHI8W2pMlJ4qI/b5u4VKAWogbd7gFp4uwbYAt5uAbaC1x1AqR9b066rSWRNENJnO0ApudHOATpAJQGleXMF9vSVf+ls2yIoMX8v7J2I9EKkUggL857gnah187Bb8opui2CmFmZP8NCXB8qLE8XUodKBCksuRGqhBfve4KFd0cueKYAwWGsY9wgPYTYM38UBVQ7gHRlY//OxHuEl1Yc/5ADi75a+sFd4uI2QvHNTAgiI0hB9jT/sGd59bOiGznEAoiwmlbeUhxoqzLI9woOvA7jFXZh5n7gAgx0Wp7iaC5AtYPYED9BwEB/+CS3rRkMtQKao9lPMASrftQN0gEoCSnNXoBLgHzpnEWCfcnHwAAAAAElFTkSuQmCC'
            className={cn(
              'w-full bg-accent object-contain object-center',
              variant === 'video' ? 'aspect-video' : 'aspect-square',
              variant === 'circle' ? 'rounded-full' : 'rounded-md'
            )}
            src={
              imageURL.trim().length < 1 ? '/broken-image.svg' : imageURL.trim()
            }
          />
        ) : placeholderIcon ? (
          placeholderIcon
        ) : skeleton ? (
          skeleton
        ) : error ? (
          <Icons.brokenImage
            className={cn(
              'size-1/2',
              props.disabled || props.readOnly ? '' : 'group-hover:invisible'
            )}
          />
        ) : (
          <Icons.user
            className={cn(
              'size-1/2',
              props.disabled || props.readOnly ? '' : 'group-hover:invisible'
            )}
          />
        )}

        {!(props.disabled || props.readOnly) && (
          <div className='absolute hidden size-full flex-col items-center justify-center bg-accent/25 backdrop-blur-sm group-hover:flex'>
            <Icons.imageUp className='size-1/2' />
          </div>
        )}
      </div>
    );
  }
);
AvatarPicker.displayName = 'AvatarPicker';
export { AvatarPicker };
