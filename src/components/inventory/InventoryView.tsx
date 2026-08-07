import React, { useState } from 'react';
import { usePetGestor } from '../../context/AppContext';
import { Product } from '../../types';
import { formatBRL } from '../../utils/formatters';
import { ProductFormModal } from './ProductFormModal';
import { 
  Package, Search, Plus, AlertTriangle, 
  Barcode, Edit3, ArrowUpRight, ArrowDownRight, FileSpreadsheet 
} from 'lucide-react';
import { exportToExcel } from '../../utils/formatters';

export const InventoryView: React.FC = () => {
  const { products, addProduct, updateProduct, adjustStock } = usePetGestor();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Stock Adjustment Modal State
  const [stockAdjustmentProduct, setStockAdjustmentProduct] = useState<Product | null>(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('compra');

  const filteredProducts = products.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      p.name.toLowerCase().includes(term) ||
      (p.barcode && p.barcode.includes(term)) ||
      (p.supplier_name && p.supplier_name.toLowerCase().includes(term));
    
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleExportExcel = () => {
    const data = products.map(p => ({
      Nome: p.name,
      'Código de Barras': p.barcode || '-',
      Categoria: p.category,
      'Preço Custo': p.cost_price,
      'Preço Venda': p.selling_price,
      'Estoque Atual': p.current_stock,
      'Estoque Mínimo': p.minimum_stock,
      Fornecedor: p.supplier_name || '-',
    }));
    exportToExcel(data, 'Estoque_PetGestor');
  };

  const handleConfirmStockAdjustment = async () => {
    if (stockAdjustmentProduct && adjustmentQuantity !== 0) {
      try {
        await adjustStock(
          stockAdjustmentProduct.id,
          adjustmentQuantity,
          adjustmentReason,
          `Ajuste manual: ${adjustmentReason}`
        );
        setStockAdjustmentProduct(null);
        setAdjustmentQuantity(0);
      } catch {
        // O contexto já exibe a mensagem detalhada do banco.
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-teal-600" />
            Controle de Estoque & Produtos
          </h2>
          <p className="text-xs text-slate-500">
            Produtos para venda, insumos do banho e alertas de estoque crítico
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel
          </button>
          <button
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition"
          >
            <Plus className="w-4 h-4" /> Cadastrar Produto
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, EAN/código de barras ou fornecedor..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold"
        >
          <option value="all">Todas as Categorias</option>
          <option value="Alimentação">Alimentação / Ração</option>
          <option value="Higiene">Higiene / Cosméticos</option>
          <option value="Acessórios">Acessórios / Brinquedos</option>
          <option value="Insumos Banho">Insumos Internos do Banho</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] uppercase font-bold text-slate-400">
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-4">EAN / Categoria</th>
                <th className="py-3 px-4">Preço Custo</th>
                <th className="py-3 px-4">Preço Venda</th>
                <th className="py-3 px-4">Estoque Atual</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.map(product => {
                const isLow = product.current_stock <= product.minimum_stock;

                return (
                  <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {product.name}
                      <span className="block text-[11px] font-normal text-slate-400">
                        {product.supplier_name || 'Sem fornecedor registrado'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-700 dark:text-slate-300">{product.category}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Barcode className="w-3 h-3" /> {product.barcode || 'Sem EAN'}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-500">{formatBRL(product.cost_price)}</td>
                    <td className="py-3 px-4 font-bold text-teal-600">{formatBRL(product.selling_price)}</td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] ${
                        isLow ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isLow && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                        {product.current_stock} {product.unit} (Mín: {product.minimum_stock})
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setStockAdjustmentProduct(product)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 dark:text-slate-200 hover:bg-slate-100 font-semibold"
                          title="Movimentar Estoque"
                        >
                          Ajustar Estoque
                        </button>
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {stockAdjustmentProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Ajustar Estoque: {stockAdjustmentProduct.name}
            </h3>

            <p className="text-slate-500">Estoque Atual: <strong>{stockAdjustmentProduct.current_stock} {stockAdjustmentProduct.unit}</strong></p>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Quantidade do Ajuste (+ para entrada, - para saída)
              </label>
              <input
                type="number"
                value={adjustmentQuantity}
                onChange={e => setAdjustmentQuantity(Number(e.target.value))}
                placeholder="Ex: 10 para entrada, -2 para perda/avaria"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Motivo da Movimentação
              </label>
              <select
                value={adjustmentReason}
                onChange={e => setAdjustmentReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              >
                <option value="compra">Compra de Fornecedor (+)</option>
                <option value="uso_interno">Consumo Interno no Banho (-)</option>
                <option value="perda">Perda / Avaria / Validade (-)</option>
                <option value="ajuste">Ajuste de Inventário</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setStockAdjustmentProduct(null)} className="px-4 py-2 border rounded-xl font-semibold">
                Cancelar
              </button>
              <button onClick={handleConfirmStockAdjustment} className="px-5 py-2 bg-teal-600 text-white rounded-xl font-bold shadow-md">
                Salvar Movimentação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      <ProductFormModal
        key={`${isModalOpen}-${editingProduct?.id || 'novo'}`}
        isOpen={isModalOpen}
        product={editingProduct}
        onClose={() => setIsModalOpen(false)}
        onSave={data => {
          if (editingProduct) updateProduct(data);
          else addProduct(data);
        }}
      />
    </div>
  );
};
