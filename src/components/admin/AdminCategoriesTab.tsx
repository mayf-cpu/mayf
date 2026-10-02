import React, { useState, useMemo } from 'react';
import {
  CategoryItem,
  CategoryType,
  saveCategoriesLocally,
  resetCategoriesToDefault,
  getParentCategories,
  getChildCategories,
  getCategoryById,
} from '../../services/categories';
import { saveCategorySettingsToFirestore } from '../../firebase';

interface AdminCategoriesTabProps {
  categories: CategoryItem[];
  onUpdateCategories: (newCategories: CategoryItem[]) => void;
  onToast: (msg: string) => void;
}

const COMMON_ICONS = [
  'toys',
  'shapes',
  'calculate',
  'pie_chart',
  'verified',
  'military_tech',
  'functions',
  'school',
  'edit_note',
  'description',
  'play_circle',
  'menu_book',
  'bolt',
  'account_tree',
  'architecture',
  'change_history',
  'grid_view',
  'view_in_ar',
  'analytics',
  'filter_1',
];

const PRESET_COLORS = [
  '#004ac6',
  '#0284c7',
  '#059669',
  '#16a34a',
  '#d97706',
  '#ea580c',
  '#dc2626',
  '#7c3aed',
  '#db2777',
  '#475569',
];

export const AdminCategoriesTab: React.FC<AdminCategoriesTabProps> = ({
  categories,
  onUpdateCategories,
  onToast,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | CategoryType>('all');
  const [hierarchyFilter, setHierarchyFilter] = useState<'all' | 'parents' | 'children'>('all');
  const [parentFilterId, setParentFilterId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<CategoryType>('grade');
  const [formParentId, setFormParentId] = useState<string>('');
  const [isSubcategoryMode, setIsSubcategoryMode] = useState<boolean>(false);
  const [formIcon, setFormIcon] = useState('calculate');
  const [formCount, setFormCount] = useState('');
  const [formBadge, setFormBadge] = useState('');
  const [formColor, setFormColor] = useState('#004ac6');
  const [formDescription, setFormDescription] = useState('');
  const [formEnabled, setFormEnabled] = useState(true);

  // Eligible parent categories for the dropdown (exclude current editing category and its descendants)
  const eligibleParents = useMemo(() => {
    return categories.filter((c) => {
      if (editingCategory && c.id === editingCategory.id) return false;
      if (editingCategory && c.parentId === editingCategory.id) return false;
      return true;
    });
  }, [categories, editingCategory]);

  // Parents and Children mapping
  const parentsList = useMemo(() => getParentCategories(categories), [categories]);

  // Filtered List
  const filteredList = useMemo(() => {
    return categories.filter((c) => {
      // Type filter
      if (selectedFilter !== 'all' && c.type !== selectedFilter) return false;

      // Hierarchy filter
      if (hierarchyFilter === 'parents' && c.parentId) return false;
      if (hierarchyFilter === 'children' && !c.parentId) return false;

      // Filter by specific parent ID
      if (parentFilterId !== 'all') {
        if (c.parentId !== parentFilterId && c.id !== parentFilterId) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const parentName = c.parentId ? getCategoryById(categories, c.parentId)?.name?.toLowerCase() || '' : '';
        return (
          c.name.toLowerCase().includes(q) ||
          (c.badge && c.badge.toLowerCase().includes(q)) ||
          (c.description && c.description.toLowerCase().includes(q)) ||
          parentName.includes(q)
        );
      }
      return true;
    });
  }, [categories, selectedFilter, hierarchyFilter, parentFilterId, searchQuery]);

  const handleOpenAddModal = (presetParentId?: string) => {
    setEditingCategory(null);
    setFormName('');
    setFormType(selectedFilter === 'all' ? 'grade' : selectedFilter);
    if (presetParentId) {
      setFormParentId(presetParentId);
      setIsSubcategoryMode(true);
      const parentCat = getCategoryById(categories, presetParentId);
      if (parentCat) {
        setFormColor(parentCat.color || '#004ac6');
      }
    } else {
      setFormParentId('');
      setIsSubcategoryMode(false);
      setFormColor('#004ac6');
    }
    setFormIcon('calculate');
    setFormCount('');
    setFormBadge('');
    setFormDescription('');
    setFormEnabled(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormType(cat.type);
    setFormParentId(cat.parentId || '');
    setIsSubcategoryMode(Boolean(cat.parentId));
    setFormIcon(cat.icon || 'calculate');
    setFormCount(cat.count || '');
    setFormBadge(cat.badge || '');
    setFormColor(cat.color || '#004ac6');
    setFormDescription(cat.description || '');
    setFormEnabled(cat.enabled);
    setIsModalOpen(true);
  };

  const handleSaveModal = () => {
    if (!formName.trim()) {
      onToast('Please enter category name');
      return;
    }

    const assignedParentId = isSubcategoryMode && formParentId.trim() ? formParentId.trim() : null;

    let updated: CategoryItem[];
    if (editingCategory) {
      updated = categories.map((c) =>
        c.id === editingCategory.id
          ? {
              ...c,
              name: formName.trim(),
              type: formType,
              parentId: assignedParentId,
              icon: formIcon,
              count: formCount.trim() || undefined,
              badge: formBadge.trim() || undefined,
              color: formColor,
              description: formDescription.trim() || undefined,
              enabled: formEnabled,
            }
          : c
      );
      onToast(`Updated category "${formName.trim()}"`);
    } else {
      const newCat: CategoryItem = {
        id: `cat-${formType}-${Date.now().toString(36)}`,
        name: formName.trim(),
        type: formType,
        parentId: assignedParentId,
        icon: formIcon,
        count: formCount.trim() || undefined,
        badge: formBadge.trim() || undefined,
        color: formColor,
        description: formDescription.trim() || undefined,
        order: categories.length + 1,
        enabled: formEnabled,
        isCustom: true,
      };
      updated = [...categories, newCat];
      onToast(`Created new category "${formName.trim()}"`);
    }

    onUpdateCategories(updated);
    saveCategoriesLocally(updated);
    setIsModalOpen(false);
  };

  const handleToggleEnabled = (id: string) => {
    const updated = categories.map((c) =>
      c.id === id ? { ...c, enabled: !c.enabled } : c
    );
    onUpdateCategories(updated);
    saveCategoriesLocally(updated);
    onToast('Category visibility toggled');
  };

  const handleDeleteCategory = (id: string, name: string) => {
    const childList = getChildCategories(categories, id);
    let confirmMsg = `Are you sure you want to delete category "${name}"?`;
    if (childList.length > 0) {
      confirmMsg += ` This category has ${childList.length} sub-categories which will become top-level categories.`;
    }

    if (window.confirm(confirmMsg)) {
      // Delete the category and detach any children to top-level
      const updated = categories
        .filter((c) => c.id !== id)
        .map((c) => (c.parentId === id ? { ...c, parentId: null } : c));

      onUpdateCategories(updated);
      saveCategoriesLocally(updated);
      onToast(`Deleted category "${name}"`);
    }
  };

  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const list = [...categories];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    const reordered = list.map((item, idx) => ({ ...item, order: idx + 1 }));
    onUpdateCategories(reordered);
    saveCategoriesLocally(reordered);
  };

  const handleSaveToCloud = async () => {
    setIsSaving(true);
    try {
      await saveCategorySettingsToFirestore(categories);
      saveCategoriesLocally(categories);
      onToast('✓ Categories synchronized to cloud & active on website!');
    } catch (_err) {
      saveCategoriesLocally(categories);
      onToast('Saved locally in browser cache.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all categories to default curriculum taxonomy? Custom categories will be replaced.')) {
      const def = resetCategoriesToDefault();
      onUpdateCategories(def);
      onToast('Categories reset to defaults');
    }
  };

  const toggleExpandParent = (parentId: string) => {
    setExpandedParents((prev) => ({
      ...prev,
      [parentId]: !prev[parentId],
    }));
  };

  // Counts by type
  const gradeCount = categories.filter((c) => c.type === 'grade' && c.enabled).length;
  const formatCount = categories.filter((c) => c.type === 'format' && c.enabled).length;
  const topicCount = categories.filter((c) => c.type === 'topic' && c.enabled).length;
  const childSubcategoriesCount = categories.filter((c) => Boolean(c.parentId)).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-bold border border-blue-400/20 mb-2">
              <span className="material-symbols-outlined text-[16px]">account_tree</span>
              Hierarchical Taxonomy &amp; Category Engine
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Manage Content Categories &amp; Subcategories
            </h2>
            <p className="text-blue-200 text-xs sm:text-sm mt-1 max-w-xl">
              Create, rename, or reorganize parent and child categories (e.g. Class 10 → Real Numbers, Trigonometry, or Format → Formula Sheets). Link any subcategory to its parent for organized student navigation.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => handleOpenAddModal()}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-2xl flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              New Category
            </button>
            <button
              onClick={handleSaveToCloud}
              disabled={isSaving}
              className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-900/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
              {isSaving ? 'Syncing...' : 'Save & Publish Live'}
            </button>
          </div>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="text-[11px] text-blue-200 font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">school</span> Parent Grades
            </div>
            <div className="text-xl font-black mt-0.5">{gradeCount}</div>
          </div>
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="text-[11px] text-blue-200 font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">description</span> Formats
            </div>
            <div className="text-xl font-black mt-0.5">{formatCount}</div>
          </div>
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="text-[11px] text-blue-200 font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">calculate</span> Math Topics
            </div>
            <div className="text-xl font-black mt-0.5">{topicCount}</div>
          </div>
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="text-[11px] text-amber-200 font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">account_tree</span> Linked Subcategories
            </div>
            <div className="text-xl font-black mt-0.5 text-amber-300">{childSubcategoriesCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        {/* Row 1: Type filter tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Categories', icon: 'apps' },
              { id: 'grade', label: 'Grades & Classes', icon: 'school' },
              { id: 'format', label: 'Resource Formats', icon: 'description' },
              { id: 'topic', label: 'Math Topics', icon: 'calculate' },
              { id: 'stream', label: 'Exam Boards', icon: 'verified' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                  selectedFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search input */}
          <div className="relative min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories & subcategories..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Row 2: Hierarchy Filter Pills (Parents only, Children only, or Filter by Parent Category) */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider mr-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">device_hub</span>
              Hierarchy:
            </span>
            {[
              { id: 'all', label: 'All Levels' },
              { id: 'parents', label: '👑 Parent Categories Only' },
              { id: 'children', label: '↳ Subcategories Only' },
            ].map((pill) => (
              <button
                key={pill.id}
                onClick={() => setHierarchyFilter(pill.id as any)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer text-xs ${
                  hierarchyFilter === pill.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Filter by Specific Parent */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 font-semibold">Filter by Parent:</span>
            <select
              value={parentFilterId}
              onChange={(e) => setParentFilterId(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Parents</option>
              {parentsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.type})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Categories Table / List */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Showing {filteredList.length} of {categories.length} Taxonomies
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredList.map((cat, index) => {
            const isChild = Boolean(cat.parentId);
            const parentCat = cat.parentId ? getCategoryById(categories, cat.parentId) : null;
            const directChildren = getChildCategories(categories, cat.id);
            const isExpanded = expandedParents[cat.id];

            return (
              <div
                key={cat.id}
                className={`p-4 transition-colors ${
                  isChild ? 'bg-slate-50/50 pl-6 sm:pl-10' : ''
                } ${!cat.enabled ? 'opacity-60' : 'hover:bg-slate-50/80'}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Category Info */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Visual tree branch connector for child categories */}
                    {isChild && (
                      <span className="material-symbols-outlined text-slate-400 text-[20px] shrink-0 mt-2 select-none">
                        subdirectory_arrow_right
                      </span>
                    )}

                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm text-white"
                      style={{ backgroundColor: cat.color || '#004ac6' }}
                    >
                      <span className="material-symbols-outlined text-[22px]">{cat.icon}</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">{cat.name}</span>

                        {/* Hierarchy Tag: Parent or Child */}
                        {isChild ? (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <span className="material-symbols-outlined text-[13px]">subdirectory_arrow_right</span>
                            Subcategory of <strong className="text-indigo-900">{parentCat?.name || 'Parent'}</strong>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <span className="material-symbols-outlined text-[13px]">folder</span>
                            Parent Category
                            {directChildren.length > 0 && (
                              <span className="ml-1 bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded-full text-[10px]">
                                {directChildren.length} child{directChildren.length > 1 ? 'ren' : ''}
                              </span>
                            )}
                          </span>
                        )}

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            cat.type === 'grade'
                              ? 'bg-blue-50 text-blue-700 border border-blue-100'
                              : cat.type === 'format'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : cat.type === 'topic'
                              ? 'bg-purple-50 text-purple-700 border border-purple-100'
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}
                        >
                          {cat.type}
                        </span>

                        {cat.badge && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-600">
                            {cat.badge}
                          </span>
                        )}

                        {cat.count && (
                          <span className="text-[11px] font-medium text-slate-400">
                            • {cat.count}
                          </span>
                        )}

                        {cat.isCustom && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                            Custom
                          </span>
                        )}
                      </div>

                      {cat.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                          {cat.description}
                        </p>
                      )}

                      {/* Sub-categories preview bar for parent categories */}
                      {!isChild && directChildren.length > 0 && (
                        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => toggleExpandParent(cat.id)}
                            className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              {isExpanded ? 'expand_less' : 'expand_more'}
                            </span>
                            {isExpanded ? 'Hide Subcategories' : `View ${directChildren.length} Subcategories:`}
                          </button>
                          {directChildren.slice(0, 4).map((ch) => (
                            <span
                              key={ch.id}
                              className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-medium"
                            >
                              {ch.name}
                            </span>
                          ))}
                          {directChildren.length > 4 && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              +{directChildren.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap">
                    {/* Add Child Category Button (Available on Parent categories) */}
                    {!isChild && (
                      <button
                        onClick={() => handleOpenAddModal(cat.id)}
                        title={`Add a new child subcategory under "${cat.name}"`}
                        className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span className="material-symbols-outlined text-[15px]">add_circle</span>
                        + Subcategory
                      </button>
                    )}

                    {/* Move order */}
                    <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                      <button
                        onClick={() => handleMoveOrder(index, 'up')}
                        disabled={index === 0}
                        title="Move up in order"
                        className="p-1 hover:bg-slate-200 disabled:opacity-30 text-slate-600 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                      </button>
                      <button
                        onClick={() => handleMoveOrder(index, 'down')}
                        disabled={index === categories.length - 1}
                        title="Move down in order"
                        className="p-1 hover:bg-slate-200 disabled:opacity-30 text-slate-600 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                      </button>
                    </div>

                    {/* Visibility Toggle */}
                    <button
                      onClick={() => handleToggleEnabled(cat.id)}
                      title={cat.enabled ? 'Enabled on website' : 'Hidden from website'}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                        cat.enabled
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        {cat.enabled ? 'visibility' : 'visibility_off'}
                      </span>
                      {cat.enabled ? 'Active' : 'Disabled'}
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleOpenEditModal(cat)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                      title="Edit Category Details & Hierarchy"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Delete Category"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Children Drawer */}
                {!isChild && isExpanded && directChildren.length > 0 && (
                  <div className="mt-3 pl-8 sm:pl-12 pt-3 border-t border-slate-100 space-y-2">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                      <span>Subcategories of {cat.name} ({directChildren.length})</span>
                      <button
                        onClick={() => handleOpenAddModal(cat.id)}
                        className="text-indigo-600 hover:underline flex items-center gap-0.5 text-xs font-bold cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[13px]">add</span>
                        Add Subcategory
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {directChildren.map((ch) => (
                        <div
                          key={ch.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 shadow-2xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="material-symbols-outlined text-[16px] text-indigo-600">
                              {ch.icon || 'subdirectory_arrow_right'}
                            </span>
                            <span className="text-xs font-semibold text-slate-800 truncate">
                              {ch.name}
                            </span>
                          </div>
                          <button
                            onClick={() => handleOpenEditModal(ch)}
                            className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                            title="Edit Subcategory"
                          >
                            <span className="material-symbols-outlined text-[14px]">edit</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredList.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-sm">
              <span className="material-symbols-outlined text-3xl mb-1">search_off</span>
              <p>No categories found matching your query and filter criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Add / Edit Category */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: formColor }}
                >
                  <span className="material-symbols-outlined text-[18px]">{formIcon}</span>
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  {editingCategory ? 'Edit Content Category' : 'Create Content Category'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Category Hierarchy Level Section */}
              <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50/60 rounded-2xl border border-blue-100/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-blue-600">account_tree</span>
                    Category Hierarchy Level *
                  </label>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-white px-2 py-0.5 rounded-full border border-blue-200">
                    Parent / Child
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSubcategoryMode(false);
                      setFormParentId('');
                    }}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      !isSubcategoryMode
                        ? 'bg-white border-blue-600 shadow-sm ring-2 ring-blue-500/20'
                        : 'bg-white/60 border-slate-200 hover:bg-white text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                      <span className="material-symbols-outlined text-[16px] text-amber-500">folder</span>
                      Top-Level Category
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Main parent category (e.g. Class 10, Formats)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsSubcategoryMode(true);
                      if (!formParentId && eligibleParents.length > 0) {
                        setFormParentId(eligibleParents[0].id);
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSubcategoryMode
                        ? 'bg-white border-indigo-600 shadow-sm ring-2 ring-indigo-500/20'
                        : 'bg-white/60 border-slate-200 hover:bg-white text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                      <span className="material-symbols-outlined text-[16px] text-indigo-600">subdirectory_arrow_right</span>
                      Child Subcategory
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Nests under an existing parent category
                    </div>
                  </button>
                </div>

                {/* Parent Category Selector Dropdown (Shown when Subcategory mode is active) */}
                {isSubcategoryMode && (
                  <div className="pt-2 border-t border-blue-100">
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Choose Parent Category *
                    </label>
                    <select
                      value={formParentId}
                      onChange={(e) => setFormParentId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="">-- Select Parent Category --</option>
                      {eligibleParents.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.type.toUpperCase()}) {p.badge ? `• ${p.badge}` : ''}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">
                      This category will be nested under the chosen parent category in curriculum navigation and filters.
                    </p>
                  </div>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Class 11, Real Numbers, 1-Page Formula Sheets"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Taxonomy Type *
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as CategoryType)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="grade">Grade / Class</option>
                    <option value="format">Resource Format</option>
                    <option value="topic">Math Topic</option>
                    <option value="stream">Exam Stream / Board</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Badge / Tagline
                  </label>
                  <input
                    type="text"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    placeholder="e.g. Board Prep 2026"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Material Symbol Icon
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                    <span className="material-symbols-outlined text-[20px]">{formIcon}</span>
                  </div>
                  <input
                    type="text"
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    placeholder="icon name (e.g. calculate)"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-100 max-h-24 overflow-y-auto">
                  {COMMON_ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setFormIcon(ic)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                        formIcon === ic ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">{ic}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Swatches */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Accent Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_COLORS.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setFormColor(col)}
                        className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                          formColor === col ? 'scale-125 ring-2 ring-blue-500' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description / Syllabus Topics
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Short overview of what is covered in this category..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Visibility Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-800">
                  Visible in Student Navigation Filters
                </span>
                <input
                  type="checkbox"
                  checked={formEnabled}
                  onChange={(e) => setFormEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md cursor-pointer"
              >
                {editingCategory ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
