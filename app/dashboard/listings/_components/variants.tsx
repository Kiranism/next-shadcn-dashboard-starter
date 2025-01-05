import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, Trash } from 'lucide-react';
import { useState } from 'react';

const ProductVariants = () => {
  const [variants, setVariants] = useState([{ variant: '', value: '' }]);

  const handleVariantChange = (
    index: number,
    field: 'variant' | 'value',
    value: string
  ) => {
    const updatedVariants = [...variants];
    updatedVariants[index][field] = value;
    setVariants(updatedVariants);
  };

  const addVariant = () => {
    setVariants([...variants, { variant: '', value: '' }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  console.log(variants);

  return (
    <div className="mt-5 space-y-4">
      {variants.map((variant, index) => (
        <div key={index} className="flex items-center space-x-4">
          {/* Dropdown for Variant Type */}
          <select
            value={variant.variant}
            onChange={(e) =>
              handleVariantChange(index, 'variant', e.target.value)
            }
            className={cn(
              'flex h-9 w-48 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            <option value="" disabled>
              Select Variant
            </option>
            <option value="Size">Size</option>
            <option value="Color">Color</option>
            <option value="Width">Width</option>
            <option value="Length">Length</option>
            <option value="Material">Material</option>
          </select>

          {/* Input for Value */}
          <input
            type="text"
            value={variant.value}
            onChange={(e) =>
              handleVariantChange(index, 'value', e.target.value)
            }
            placeholder="Enter value"
            className={cn(
              'flex h-9 w-72 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
            )}
          />

          {/* Remove Variant Button */}
          {variants.length > 1 && (
            <button
              type="button"
              onClick={() => removeVariant(index)}
              className="text-red-500 hover:underline"
            >
              <Trash size={15} />
            </button>
          )}
        </div>
      ))}

      {/* Add Another Option Button */}
      <button
        type="button"
        onClick={addVariant}
        className={cn(buttonVariants({ variant: 'default' }))}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Another Option
      </button>
    </div>
  );
};

export default ProductVariants;
