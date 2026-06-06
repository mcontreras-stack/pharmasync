'use client';

import React, { useState } from 'react';
import { getMockDb, saveMockDb, CmsArticle } from '@/lib/mockDb';
import { Bookmark, Plus, Search, Filter, CheckCircle, Clock, Trash2, FileText, X, Send, Eye } from 'lucide-react';

export default function CmsContent() {
  const [db, setDb] = useState(getMockDb());
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'Pregnancy' | 'Prenatal' | 'Pediatric' | 'General'>('all');

  // Modal / Inputs state
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'Pregnancy' | 'Prenatal' | 'Pediatric' | 'General'>('Pregnancy');
  const [newContent, setNewContent] = useState('');
  const [newTagsStr, setNewTagsStr] = useState('');
  const [newStatus, setNewStatus] = useState<'draft' | 'published'>('draft');

  // Filters
  const filteredArticles = db.cms_articles.filter(art => {
    const matchesSearch = 
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || art.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Action: Toggle Publish
  const handleTogglePublish = (articleId: string) => {
    const updatedArticles = db.cms_articles.map(art => {
      if (art.id === articleId) {
        return {
          ...art,
          status: art.status === 'published' ? 'draft' as const : 'published' as const
        };
      }
      return art;
    });

    const updatedDb = { ...db, cms_articles: updatedArticles };
    setDb(updatedDb);
    saveMockDb(updatedDb);
  };

  // Action: Delete Article
  const handleDeleteArticle = (articleId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar permanentemente este artículo educativo?')) return;

    const updatedArticles = db.cms_articles.filter(art => art.id !== articleId);
    const updatedDb = { ...db, cms_articles: updatedArticles };
    setDb(updatedDb);
    saveMockDb(updatedDb);
  };

  // Action: Save New Article
  const handleSaveArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const tags = newTagsStr
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const newArticle: CmsArticle = {
      id: `art-${Date.now()}`,
      title: newTitle,
      category: newCategory,
      tags,
      content: newContent,
      status: newStatus,
      author: 'Admin Juan',
      created_at: new Date().toISOString()
    };

    const updatedDb = {
      ...db,
      cms_articles: [newArticle, ...db.cms_articles]
    };
    
    setDb(updatedDb);
    saveMockDb(updatedDb);

    // Reset fields
    setNewTitle(''); setNewCategory('Pregnancy'); setNewContent('');
    setNewTagsStr(''); setNewStatus('draft'); setIsCreating(false);
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
      {/* Search, Filter, and Add controls */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-slate-700 shrink-0" />
            Consola CMS de Educación Prenatal & Pediátrica
          </h3>
          <p className="text-[10px] text-gray-400 mt-0.5">Publica artículos, guías de lactancia y consejos médicos segmentados</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar artículos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-150 rounded-xl text-xs bg-slate-50 focus:outline-none focus:bg-white focus:border-slate-400 w-52 font-medium"
            />
          </div>

          {/* Category filter select */}
          <select
            value={categoryFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategoryFilter(e.target.value as 'all' | 'Pregnancy' | 'Prenatal' | 'Pediatric' | 'General')}
            className="bg-slate-50 border border-gray-150 rounded-xl p-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">Todas las Categorías</option>
            <option value="Pregnancy">Embarazo Activo</option>
            <option value="Prenatal">Control Prenatal</option>
            <option value="Pediatric">Control Pediátrico</option>
            <option value="General">General / Nutrición</option>
          </select>

          {/* Add trigger */}
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1 px-3 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo Artículo
          </button>
        </div>
      </div>

      {/* Grid of articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400 font-medium text-xs">
            No se encontraron artículos en esta categoría.
          </div>
        ) : (
          filteredArticles.map(art => (
            <div key={art.id} className="border border-gray-100 rounded-3xl p-5 bg-slate-50/50 flex flex-col justify-between hover:shadow-xs transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${art.category === 'Pregnancy' ? 'bg-pink-100 text-pink-700' : art.category === 'Prenatal' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {art.category === 'Pregnancy' ? 'Embarazo' : art.category === 'Prenatal' ? 'Prenatal' : art.category === 'Pediatric' ? 'Pediátrico' : 'General'}
                  </span>
                  <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.25 rounded-md ${art.status === 'published' ? 'bg-emerald-55 text-emerald-600' : 'bg-gray-200 text-gray-500'}`}>
                    {art.status === 'published' ? 'Publicado' : 'Borrador'}
                  </span>
                </div>

                <h4 className="font-bold text-gray-800 mt-3 text-xs leading-normal">{art.title}</h4>
                <p className="text-[10px] text-gray-400 mt-2 line-clamp-4 leading-normal">{art.content}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-4">
                  {art.tags?.map((t: string) => (
                    <span key={t} className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg font-medium">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action footer */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-150/60">
                <span className="text-[9px] text-gray-400 font-medium">Por: {art.author}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTogglePublish(art.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold transition-colors ${art.status === 'published' ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                  >
                    {art.status === 'published' ? 'Despublicar' : 'Publicar'}
                  </button>
                  <button
                    onClick={() => handleDeleteArticle(art.id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: CREATE ARTICLE */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-[32px] border border-gray-100 w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCreating(false)}
              className="absolute right-4 top-4 p-2 text-gray-400 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-slate-700" />
              Redactar Nuevo Artículo Médico
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5">El contenido redactado estará disponible en la biblioteca de consejos</p>

            <form onSubmit={handleSaveArticle} className="mt-4 space-y-4">
              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Título del Artículo</label>
                <input
                  type="text"
                  placeholder="Ej. Guía para el sueño seguro del lactante"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-150 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:bg-white focus:border-slate-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Categoría</label>
                  <select
                    value={newCategory}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewCategory(e.target.value as 'Pregnancy' | 'Prenatal' | 'Pediatric' | 'General')}
                    className="w-full bg-slate-50 border border-gray-150 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:bg-white focus:border-slate-400"
                  >
                    <option value="Pregnancy">Embarazo Activo</option>
                    <option value="Prenatal">Control Prenatal</option>
                    <option value="Pediatric">Control Pediátrico</option>
                    <option value="General">General / Nutrición</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Estado Inicial</label>
                  <select
                    value={newStatus}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewStatus(e.target.value as 'draft' | 'published')}
                    className="w-full bg-slate-50 border border-gray-150 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:bg-white focus:border-slate-400"
                  >
                    <option value="draft">Borrador</option>
                    <option value="published">Publicado Directamente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Etiquetas (Separadas por comas)</label>
                <input
                  type="text"
                  placeholder="Ej. hitos, estimulacion, sueno"
                  value={newTagsStr}
                  onChange={(e) => setNewTagsStr(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-150 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:bg-white focus:border-slate-400"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Contenido del Artículo</label>
                <textarea
                  placeholder="Escribe el artículo educativo aquí..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full h-36 bg-slate-50 border border-gray-150 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:bg-white focus:border-slate-400 resize-none leading-relaxed"
                  required
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-800 transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                  Crear Artículo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
