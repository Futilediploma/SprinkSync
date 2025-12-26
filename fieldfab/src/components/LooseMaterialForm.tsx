import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import CircularProgress from '@mui/material/CircularProgress';
import type { Product } from '../data/productsDb';
import {
  initProductsDatabase,
  populateDatabaseFromCSV,
  searchProducts,
  isDatabasePopulated,
  getProductCount,
  getAllManufacturers,
} from '../data/productsDb';

type LooseMaterialFormProps = {
  onAdd: (material: MaterialItem) => void;
  initialValues?: MaterialItem;
  isEditing?: boolean;
};

export type MaterialItem = {
  id: string;
  qty: number;
  part: string;
  size: string;
  description: string;
  type: string;
  options?: string[]; // Selected options from description
  sizes?: string[]; // Selected sizes from available sizes
};

export default function LooseMaterialForm({ onAdd, initialValues, isEditing = false }: LooseMaterialFormProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [dbLoading, setDbLoading] = useState(true);
  const [productCount, setProductCount] = useState(0);
  const [productTypeFilter, setProductTypeFilter] = useState<string>('all');
  const [manufacturerFilter, setManufacturerFilter] = useState<string>('all');
  const [availableManufacturers, setAvailableManufacturers] = useState<string[]>([]);

  const [qty, setQty] = useState<number>(1);
  const [size, setSize] = useState<string>('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [availableOptions, setAvailableOptions] = useState<string[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [customSize, setCustomSize] = useState<string>('');
  const [selectedMaterialType, setSelectedMaterialType] = useState<string>('');

  // State for reducing fittings
  const [isReducingFitting, setIsReducingFitting] = useState<'tee' | 'elbow' | 'cone' | null>(null);
  const [reducingSize1, setReducingSize1] = useState<string>('');
  const [reducingSize2, setReducingSize2] = useState<string>('');
  const [reducingSize3, setReducingSize3] = useState<string>(''); // Only for tee

  const justSelectedProduct = useRef(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        inputRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Initialize database on mount
  useEffect(() => {
    async function initializeDb() {
      try {
        await initProductsDatabase();
        const isPopulated = await isDatabasePopulated();

        if (!isPopulated) {
          await populateDatabaseFromCSV();
        }

        const count = await getProductCount();
        setProductCount(count);

        // Load available manufacturers
        const manufacturers = await getAllManufacturers();
        setAvailableManufacturers(manufacturers);

        setDbInitialized(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
      } finally {
        setDbLoading(false);
      }
    }

    initializeDb();
  }, []);

  // Load initial values when editing
  useEffect(() => {
    if (initialValues) {
      setQty(initialValues.qty);
      setSize(initialValues.size);
      setSearchQuery(initialValues.part);
      setDescription(initialValues.description);
      setType(initialValues.type);
      setSelectedOptions(initialValues.options || []);
      setSelectedSizes(initialValues.sizes || []);

      // Extract material type from options if present
      const materialTypes = ['Ductile Iron', 'Cast Iron', 'Malleable Iron'];
      const foundMaterialType = initialValues.options?.find(opt =>
        materialTypes.some(mt => opt.includes(mt))
      );
      if (foundMaterialType) {
        setSelectedMaterialType(foundMaterialType);
      }

      // Detect reducing fittings from size field format
      const sizeStr = initialValues.size;
      if (sizeStr && sizeStr.includes(' x ')) {
        const sizes = sizeStr.split(' x ').map(s => s.trim());
        const productName = initialValues.part.toLowerCase();

        if (sizes.length === 3 && productName.includes('tee')) {
          setIsReducingFitting('tee');
          setReducingSize1(sizes[0]);
          setReducingSize2(sizes[1]);
          setReducingSize3(sizes[2]);
        } else if (sizes.length === 2) {
          if (productName.includes('elbow') || productName.includes('90')) {
            setIsReducingFitting('elbow');
          } else if (productName.includes('cone') || productName.includes('concentric') || productName.includes('eccentric')) {
            setIsReducingFitting('cone');
          }
          setReducingSize1(sizes[0]);
          setReducingSize2(sizes[1]);
        }
      }
    }
  }, [initialValues]);

  // Search products as user types
  useEffect(() => {
    async function performSearch() {
      // Don't search if we just selected a product
      if (justSelectedProduct.current) {
        justSelectedProduct.current = false;
        return;
      }
      
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        try {
          const results = await searchProducts(searchQuery, 10);
          const filteredResults = filterResultsByType(results, productTypeFilter, manufacturerFilter);
          setSearchResults(filteredResults);
          setShowResults(filteredResults.length > 0);
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
          setShowResults(false);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }

    const debounceTimer = setTimeout(performSearch, 150);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, productTypeFilter, manufacturerFilter]);

  const handleSelectProduct = (product: Product) => {
    justSelectedProduct.current = true; // Set flag to prevent search
    setSearchQuery(product.product_name);
    setDescription(product.short_description);
    setShowResults(false);
    setSearchResults([]); // Clear search results to prevent reopening

    // Try to extract type/category from product name
    const name = product.product_name.toLowerCase();
    if (name.includes('valve')) setType('Valve');
    else if (name.includes('coupling')) setType('Coupling');
    else if (name.includes('sprinkler')) setType('Sprinkler');
    // Check for THREADED fittings BEFORE generic fittings (order matters!)
    else if (name.includes('threaded') && (
      name.includes('elbow') || name.includes('tee') || name.includes('fitting') ||
      name.includes('reducer') || name.includes('cap') || name.includes('plug') ||
      name.includes('union') || name.includes('bushing') || name.includes('nipple') ||
      name.includes('cross') || name.includes('lateral') || name.includes('locknut') ||
      name.includes('return bend')
    )) {
      setType('Threaded Fitting');
    }
    // Grooved fittings (original fitting category)
    else if (name.includes('fitting')) setType('Fitting');
    else if (name.includes('elbow')) setType('Fitting');
    else if (name.includes('tee')) setType('Fitting');
    else setType('Other');

    // Parse options from description
    const options = parseOptionsFromDescription(product.short_description);
    setAvailableOptions(options);
    setSelectedOptions([]);

    // Parse sizes from description
    const sizes = parseSizesFromDescription(product.short_description);
    setAvailableSizes(sizes);
    setSelectedSizes([]);

    // Reset material type when selecting a new product
    setSelectedMaterialType('');

    // Detect reducing fittings
    if (name.includes('reducing')) {
      if (name.includes('tee')) {
        setIsReducingFitting('tee');
      } else if (name.includes('elbow') || name.includes('90')) {
        setIsReducingFitting('elbow');
      } else if (name.includes('cone') || name.includes('concentric') || name.includes('eccentric')) {
        setIsReducingFitting('cone');
      } else {
        setIsReducingFitting(null);
      }
    } else {
      setIsReducingFitting(null);
    }

    // Reset reducing sizes
    setReducingSize1('');
    setReducingSize2('');
    setReducingSize3('');
  };

  /**
   * Determine product type category based on product name keywords
   * Uses same logic as type detection in handleSelectProduct
   */
  const getProductType = (productName: string): string => {
    const name = productName.toLowerCase();

    if (name.includes('valve')) return 'valve';
    if (name.includes('sprinkler')) return 'sprinkler';

    // Check THREADED fittings/couplings first (order matters!)
    if (name.includes('threaded') && (
      name.includes('elbow') || name.includes('tee') || name.includes('fitting') ||
      name.includes('reducer') || name.includes('cap') || name.includes('plug') ||
      name.includes('union') || name.includes('bushing') || name.includes('nipple') ||
      name.includes('cross') || name.includes('lateral') || name.includes('locknut') ||
      name.includes('return bend') || name.includes('coupling')
    )) {
      return 'threaded-fitting';
    }

    // Check for regular couplings (after threaded check)
    if (name.includes('coupling')) return 'coupling';

    // Grooved fittings (original fitting category)
    if (name.includes('fitting') || name.includes('elbow') || name.includes('tee')) {
      return 'grooved-fitting';
    }

    return 'other';
  };

  /**
   * Filter search results based on manufacturer and product type
   */
  const filterResultsByType = (results: Product[], filterType: string, filterManufacturer: string): Product[] => {
    let filtered = results;

    // Filter by manufacturer first
    if (filterManufacturer !== 'all') {
      filtered = filtered.filter(product =>
        product.manufacturer?.toLowerCase() === filterManufacturer.toLowerCase()
      );
    }

    // Then filter by product type
    if (filterType !== 'all') {
      filtered = filtered.filter(product => {
        const productType = getProductType(product.product_name);
        return productType === filterType;
      });
    }

    return filtered;
  };

  /**
   * Parse sizes from description like "Sizes from 8 - 144" | DN200 - DN3600" or "1½ - 8 | DN40 - DN200"
   */
  const parseSizesFromDescription = (desc: string): string[] => {
    const commonSizes = ['1/2', '3/4', '1', '1 1/4', '1 1/2', '2', '2 1/2', '3', '4', '6', '8', '10', '12', '14', '16', '18', '20', '24', '30', '36', '42', '48', '54', '60', '72', '84', '96', '108', '120', '144'];
    
    // Look for "Sizes from X - Y" or "X - Y inch/DN" patterns
    const sizeMatch = desc.match(/Sizes?\s+(?:from\s+)?([0-9½¼⅛⅜⅝⅞\s\-"]+)(?:\s*\||\s*inch|\s*DN|\.)/i);
    if (!sizeMatch) return [];

    const sizeText = sizeMatch[1];
    
    // Try to extract range like "8 - 144" or "1½ - 8"
    const rangeMatch = sizeText.match(/([0-9½¼⅛⅜⅝⅞]+)\s*-\s*([0-9]+)/);
    if (rangeMatch) {
      const start = parseFloat(rangeMatch[1].replace('½', '.5').replace('¼', '.25').replace('¾', '.75'));
      const end = parseFloat(rangeMatch[2]);
      
      // Return sizes within this range from common sizes
      return commonSizes.filter(size => {
        const numSize = parseFloat(size.replace(' ', '.'));
        return numSize >= start && numSize <= end;
      }).map(s => s.includes(' ') ? s : s + '"');
    }

    return [];
  };

  /**
   * Parse options from description like "Available bare, pretrimmed, as a Vic-Quick riser or in a Series 745..."
   */
  const parseOptionsFromDescription = (desc: string): string[] => {
    // Look for "Available X, Y, Z or W" pattern
    const availableMatch = desc.match(/Available\s+([^.]+)/i);
    if (!availableMatch) return [];

    const optionsText = availableMatch[1];
    // Split by comma or "or"
    const rawOptions = optionsText.split(/,\s*|\s+or\s+/i);

    return rawOptions
      .map(opt => opt.trim())
      .filter(opt => opt.length > 0 && opt.length < 100); // Filter out empty or too long strings
  };

  const handleOptionToggle = (option: string) => {
    setSelectedOptions(prev => {
      if (prev.includes(option)) {
        return prev.filter(o => o !== option);
      } else {
        return [...prev, option];
      }
    });
  };

  const handleSizeToggle = (size: string) => {
    setSelectedSizes(prev => {
      if (prev.includes(size)) {
        return prev.filter(s => s !== size);
      } else {
        return [...prev, size];
      }
    });
  };

  const handleAddMaterial = () => {
    if (!searchQuery || qty <= 0) {
      alert('Please fill in all required fields');
      return;
    }

    // Build size for reducing fittings
    let finalSize = size;
    if (isReducingFitting === 'tee') {
      // Reducing Tee: 3 sizes (e.g., "2" x 1" x 1 1/4"")
      if (!reducingSize1 || !reducingSize2 || !reducingSize3) {
        alert('Please enter all three sizes for the reducing tee');
        return;
      }
      finalSize = `${reducingSize1} x ${reducingSize2} x ${reducingSize3}`;
    } else if (isReducingFitting === 'elbow' || isReducingFitting === 'cone') {
      // Reducing Elbow/Cone: 2 sizes (e.g., "3" x 1"")
      if (!reducingSize1 || !reducingSize2) {
        alert('Please enter both sizes for the reducing fitting');
        return;
      }
      finalSize = `${reducingSize1} x ${reducingSize2}`;
    } else if (selectedSizes.length > 0) {
      finalSize = selectedSizes.join(', ');
    }

    // Build description with material type for threaded fittings
    let finalDescription = description || searchQuery;
    if (type === 'Threaded Fitting' && selectedMaterialType) {
      // Prepend material type to description
      finalDescription = `${selectedMaterialType} - ${finalDescription}`;
    }

    // Build options array including material type for threaded fittings
    let finalOptions = [...selectedOptions];
    if (type === 'Threaded Fitting' && selectedMaterialType && !finalOptions.includes(selectedMaterialType)) {
      finalOptions.push(selectedMaterialType);
    }

    const material: MaterialItem = {
      id: isEditing && initialValues ? initialValues.id : Date.now().toString(),
      qty,
      part: searchQuery,
      size: finalSize,
      description: finalDescription,
      type: type || 'Other',
      options: finalOptions.length > 0 ? finalOptions : undefined,
      sizes: selectedSizes.length > 0 ? selectedSizes : undefined,
    };

    onAdd(material);

    // Reset form only if not editing
    if (!isEditing) {
      setQty(1);
      setSearchQuery('');
      setSize('');
      setDescription('');
      setType('');
      setAvailableOptions([]);
      setSelectedOptions([]);
      setAvailableSizes([]);
      setSelectedSizes([]);
      setCustomSize('');
      setSelectedMaterialType('');
      setIsReducingFitting(null);
      setReducingSize1('');
      setReducingSize2('');
      setReducingSize3('');
    }
  };

  const commonSizes = ['3/4"', '1"', '1 1/4"', '1 1/2"', '2"', '2 1/2"', '3"', '4"', '6"', '8"', '10"', '12"'];

  if (dbLoading) {
    return (
      <Box sx={{ p: 4, backgroundColor: '#fff', borderRadius: 2, boxShadow: 2, textAlign: 'center' }}>
        <CircularProgress />
        <div style={{ marginTop: 16, color: '#666' }}>Loading product database...</div>
      </Box>
    );
  }

  if (!dbInitialized) {
    return (
      <Box sx={{ p: 4, backgroundColor: '#fff', borderRadius: 2, boxShadow: 2, textAlign: 'center' }}>
        <div style={{ color: '#d32f2f' }}>Failed to load product database</div>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, backgroundColor: '#fff', borderRadius: 2, boxShadow: 2, overflow: 'visible' }}>
      {productCount > 0 && (
        <div style={{ marginBottom: 12, color: '#666', fontSize: '0.875rem' }}>
          {productCount} products available
        </div>
      )}
      <Stack spacing={3} sx={{ overflow: 'visible' }}>
        {/* Brand Filter */}
        <FormControl fullWidth size="small">
          <InputLabel id="brand-filter-label">Brand</InputLabel>
          <Select
            labelId="brand-filter-label"
            id="brand-filter"
            value={manufacturerFilter}
            onChange={(e) => setManufacturerFilter(e.target.value)}
            label="Brand"
          >
            <MenuItem value="all">All Brands</MenuItem>
            {availableManufacturers.map((manufacturer) => (
              <MenuItem key={manufacturer} value={manufacturer.toLowerCase()}>
                {manufacturer}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Product Type Filter */}
        <FormControl fullWidth size="small">
          <InputLabel id="product-type-filter-label">Product Type</InputLabel>
          <Select
            labelId="product-type-filter-label"
            id="product-type-filter"
            value={productTypeFilter}
            onChange={(e) => setProductTypeFilter(e.target.value)}
            label="Product Type"
          >
            <MenuItem value="all">All Products</MenuItem>
            <MenuItem value="grooved-fitting">Grooved Fittings</MenuItem>
            <MenuItem value="threaded-fitting">Threaded Fittings</MenuItem>
            <MenuItem value="valve">Valves</MenuItem>
            <MenuItem value="coupling">Couplings</MenuItem>
            <MenuItem value="sprinkler">Sprinklers</MenuItem>
          </Select>
        </FormControl>

        <div style={{ position: 'relative', overflow: 'visible' }} ref={inputRef}>
          <TextField
            fullWidth
            label="Part Number / Product Name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              manufacturerFilter === 'all'
                ? "Search all manufacturers..."
                : `Search ${manufacturerFilter.charAt(0).toUpperCase() + manufacturerFilter.slice(1)} products...`
            }
            variant="outlined"
            required
            InputProps={{
              endAdornment: isSearching ? <CircularProgress size={20} /> : null,
            }}
          />
          {showResults && searchResults.length > 0 && (
            <div
              ref={dropdownRef}
              onMouseDown={(e) => e.preventDefault()}
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                right: 0,
                maxHeight: 300,
                overflowY: 'auto',
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: 4,
                zIndex: 9999,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              {searchResults.map((product, idx) => (
                <div
                    key={`${product.id || idx}-${product.product_name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectProduct(product);
                    }}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #eee',
                      transition: 'background 0.15s',
                      backgroundColor: '#fff',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#fff';
                    }}
                  >
                    <div style={{ fontWeight: 500, color: '#000' }}>
                      {product.product_name || 'NO NAME'}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <TextField
          fullWidth
          type="number"
          label="Quantity"
          value={qty}
          onChange={(e) => {
            const value = e.target.value;
            setQty(value === '' ? 0 : parseInt(value));
          }}
          inputProps={{ min: 1 }}
          required
          sx={{
            '& input[type=number]': {
              MozAppearance: 'textfield',
            },
            '& input[type=number]::-webkit-outer-spin-button': {
              WebkitAppearance: 'none',
              margin: 0,
            },
            '& input[type=number]::-webkit-inner-spin-button': {
              WebkitAppearance: 'none',
              margin: 0,
            },
          }}
        />

        {isReducingFitting ? (
          <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12, color: '#333' }}>
              {isReducingFitting === 'tee' && 'Reducing Tee Sizes (3 required):'}
              {isReducingFitting === 'elbow' && 'Reducing Elbow Sizes (2 required):'}
              {isReducingFitting === 'cone' && 'Reducing Cone Sizes (2 required):'}
            </div>
            <Stack spacing={2}>
              <TextField
                fullWidth
                size="small"
                label="Size 1"
                value={reducingSize1}
                onChange={(e) => setReducingSize1(e.target.value)}
                placeholder='e.g., 2", 3", etc.'
              />
              <TextField
                fullWidth
                size="small"
                label="Size 2"
                value={reducingSize2}
                onChange={(e) => setReducingSize2(e.target.value)}
                placeholder='e.g., 1", 1 1/2", etc.'
              />
              {isReducingFitting === 'tee' && (
                <TextField
                  fullWidth
                  size="small"
                  label="Size 3"
                  value={reducingSize3}
                  onChange={(e) => setReducingSize3(e.target.value)}
                  placeholder='e.g., 1 1/4", 2", etc.'
                />
              )}
              {(isReducingFitting === 'tee' ? (reducingSize1 && reducingSize2 && reducingSize3) : (reducingSize1 && reducingSize2)) && (
                <div style={{ marginTop: 8, fontSize: '0.8rem', color: '#666', fontStyle: 'italic' }}>
                  Preview: {reducingSize1} x {reducingSize2}{isReducingFitting === 'tee' ? ` x ${reducingSize3}` : ''}
                </div>
              )}
            </Stack>
          </Box>
        ) : availableSizes.length > 0 ? (
          <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12, color: '#333' }}>
              Available Sizes:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {availableSizes.map((sizeOption, idx) => (
                <label
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    color: '#000',
                    minWidth: '80px',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedSizes.includes(sizeOption)}
                    onChange={() => handleSizeToggle(sizeOption)}
                    style={{
                      marginRight: 6,
                      width: 18,
                      height: 18,
                      cursor: 'pointer',
                    }}
                  />
                  <span style={{ fontWeight: 500, color: '#000' }}>{sizeOption}</span>
                </label>
              ))}
            </div>

            {/* Custom Size Input */}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #ddd' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, color: '#666' }}>
                Need a different size?
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <TextField
                  size="small"
                  label="Custom Size"
                  value={customSize}
                  onChange={(e) => setCustomSize(e.target.value)}
                  placeholder='e.g., 1 1/4", 5", etc.'
                  sx={{ flex: 1 }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    if (customSize.trim()) {
                      handleSizeToggle(customSize.trim());
                      setCustomSize('');
                    }
                  }}
                  sx={{ minWidth: '80px', height: '40px' }}
                >
                  Add Size
                </Button>
              </div>
            </div>
          </Box>
        ) : (
          <FormControl fullWidth>
            <InputLabel>Size</InputLabel>
            <Select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              label="Size"
            >
              <MenuItem value="">
                <em>Select size</em>
              </MenuItem>
              {commonSizes.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <TextField
          fullWidth
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          rows={2}
          placeholder="Auto-filled from product selection"
        />

        {availableOptions.length > 0 && (
          <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8, color: '#333' }}>
              Available Options:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {availableOptions.map((option, idx) => (
                <label
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    color: '#000',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedOptions.includes(option)}
                    onChange={() => handleOptionToggle(option)}
                    style={{
                      marginRight: 8,
                      width: 18,
                      height: 18,
                      cursor: 'pointer',
                    }}
                  />
                  <span style={{ textTransform: 'capitalize', color: '#000' }}>{option}</span>
                </label>
              ))}
            </div>
          </Box>
        )}

        <FormControl fullWidth>
          <InputLabel>Type</InputLabel>
          <Select
            value={type}
            onChange={(e) => setType(e.target.value)}
            label="Type"
          >
            <MenuItem value="">
              <em>Select type</em>
            </MenuItem>
            <MenuItem value="Valve">Valve</MenuItem>
            <MenuItem value="Coupling">Coupling</MenuItem>
            <MenuItem value="Fitting">Fitting (Grooved)</MenuItem>
            <MenuItem value="Threaded Fitting">Threaded Fitting</MenuItem>
            <MenuItem value="Sprinkler">Sprinkler</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </Select>
        </FormControl>

        {/* Material Type Selection - Only for Threaded Fittings */}
        {type === 'Threaded Fitting' && (
          <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12, color: '#333' }}>
              Material Type:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Ductile Iron', 'Cast Iron', 'Malleable Iron'].map((materialType) => (
                <label
                  key={materialType}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    color: '#000',
                  }}
                >
                  <input
                    type="radio"
                    name="materialType"
                    checked={selectedMaterialType === materialType}
                    onChange={() => setSelectedMaterialType(materialType)}
                    style={{
                      marginRight: 8,
                      width: 18,
                      height: 18,
                      cursor: 'pointer',
                    }}
                  />
                  <span style={{ color: '#000', fontWeight: 500 }}>{materialType}</span>
                </label>
              ))}
            </div>
            {selectedMaterialType && (
              <div style={{ marginTop: 12, fontSize: '0.8rem', color: '#666', fontStyle: 'italic' }}>
                Will be added to description: "{selectedMaterialType} - {description || searchQuery}"
              </div>
            )}
          </Box>
        )}

        <Button
          variant="contained"
          onClick={handleAddMaterial}
          sx={{
            backgroundColor: '#1976d2',
            padding: '12px',
            fontSize: '1rem',
            fontWeight: 600,
          }}
        >
          {isEditing ? 'Update Material' : 'Add to List'}
        </Button>
      </Stack>
    </Box>
  );
}
