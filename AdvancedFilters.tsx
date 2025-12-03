import React, { useState, useEffect } from 'react';
import { AdvancedFilters, Product } from './types';
import { api } from './services';
import { Button, Card, Input, Select } from './components';

interface AdvancedFiltersProps {
    companyId: string;
    onFilterChange: (filters: AdvancedFilters) => void;
    onClear: () => void;
}

export const AdvancedFiltersComponent: React.FC<AdvancedFiltersProps> = ({
    companyId,
    onFilterChange,
    onClear
}) => {
    const [expanded, setExpanded] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);

    // Filter state
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [totalSpentMin, setTotalSpentMin] = useState<string>('');
    const [totalSpentMax, setTotalSpentMax] = useState<string>('');
    const [purchaseCountMin, setPurchaseCountMin] = useState<string>('');
    const [purchaseCountMax, setPurchaseCountMax] = useState<string>('');
    const [cashbackMin, setCashbackMin] = useState<string>('');
    const [cashbackMax, setCashbackMax] = useState<string>('');
    const [lastPurchaseFrom, setLastPurchaseFrom] = useState<string>('');
    const [lastPurchaseTo, setLastPurchaseTo] = useState<string>('');

    useEffect(() => {
        loadProducts();
    }, [companyId]);

    const loadProducts = async () => {
        try {
            const data = await api.getProducts(companyId);
            setProducts(data);
        } catch (error) {
            console.error('Error loading products:', error);
        }
    };

    const handleApply = () => {
        const filters: AdvancedFilters = {};

        if (selectedProducts.length > 0) filters.products = selectedProducts;
        if (totalSpentMin) filters.totalSpentMin = parseFloat(totalSpentMin);
        if (totalSpentMax) filters.totalSpentMax = parseFloat(totalSpentMax);
        if (purchaseCountMin) filters.purchaseCountMin = parseInt(purchaseCountMin);
        if (purchaseCountMax) filters.purchaseCountMax = parseInt(purchaseCountMax);
        if (cashbackMin) filters.cashbackAvailableMin = parseFloat(cashbackMin);
        if (cashbackMax) filters.cashbackAvailableMax = parseFloat(cashbackMax);
        if (lastPurchaseFrom) filters.lastPurchaseFrom = lastPurchaseFrom;
        if (lastPurchaseTo) filters.lastPurchaseTo = lastPurchaseTo;

        onFilterChange(filters);
    };

    const handleClear = () => {
        setSelectedProducts([]);
        setTotalSpentMin('');
        setTotalSpentMax('');
        setPurchaseCountMin('');
        setPurchaseCountMax('');
        setCashbackMin('');
        setCashbackMax('');
        setLastPurchaseFrom('');
        setLastPurchaseTo('');
        onClear();
    };

    const handleProductToggle = (productName: string) => {
        setSelectedProducts(prev =>
            prev.includes(productName)
                ? prev.filter(p => p !== productName)
                : [...prev, productName]
        );
    };

    return (
        <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">🔍 Filtros Avançados</h3>
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-brand-primary hover:text-brand-primary/80 text-sm font-medium"
                >
                    {expanded ? '▲ Ocultar' : '▼ Expandir'}
                </button>
            </div>

            {expanded && (
                <div className="space-y-4">
                    {/* Produtos */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Produtos Comprados
                        </label>
                        <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1">
                            {products.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-2">
                                    Nenhum produto cadastrado
                                </p>
                            ) : (
                                products.map(product => (
                                    <label
                                        key={product.id}
                                        className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedProducts.includes(product.name)}
                                            onChange={() => handleProductToggle(product.name)}
                                            className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                                        />
                                        <span className="text-sm text-gray-700">{product.name}</span>
                                        {product.category && (
                                            <span className="text-xs text-gray-500">({product.category})</span>
                                        )}
                                    </label>
                                ))
                            )}
                        </div>
                        {selectedProducts.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                                {selectedProducts.length} produto(s) selecionado(s)
                            </p>
                        )}
                    </div>

                    {/* Total Gasto */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Gasto Mínimo (R$)
                            </label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={totalSpentMin}
                                onChange={(e) => setTotalSpentMin(e.target.value)}
                                step="0.01"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Gasto Máximo (R$)
                            </label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={totalSpentMax}
                                onChange={(e) => setTotalSpentMax(e.target.value)}
                                step="0.01"
                            />
                        </div>
                    </div>

                    {/* Número de Compras */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mínimo de Compras
                            </label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={purchaseCountMin}
                                onChange={(e) => setPurchaseCountMin(e.target.value)}
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Máximo de Compras
                            </label>
                            <Input
                                type="number"
                                placeholder="100"
                                value={purchaseCountMax}
                                onChange={(e) => setPurchaseCountMax(e.target.value)}
                                min="0"
                            />
                        </div>
                    </div>

                    {/* Cashback Disponível */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cashback Mínimo (R$)
                            </label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={cashbackMin}
                                onChange={(e) => setCashbackMin(e.target.value)}
                                step="0.01"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cashback Máximo (R$)
                            </label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={cashbackMax}
                                onChange={(e) => setCashbackMax(e.target.value)}
                                step="0.01"
                            />
                        </div>
                    </div>

                    {/* Última Compra */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Última Compra (De)
                            </label>
                            <Input
                                type="date"
                                value={lastPurchaseFrom}
                                onChange={(e) => setLastPurchaseFrom(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Última Compra (Até)
                            </label>
                            <Input
                                type="date"
                                value={lastPurchaseTo}
                                onChange={(e) => setLastPurchaseTo(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex gap-2 pt-2">
                        <Button
                            onClick={handleClear}
                            variant="secondary"
                            className="flex-1"
                        >
                            🗑️ Limpar Filtros
                        </Button>
                        <Button
                            onClick={handleApply}
                            className="flex-1 bg-brand-primary hover:bg-brand-primary/90"
                        >
                            🔍 Aplicar Filtros
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    );
};
