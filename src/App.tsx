import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  User, 
  MapPin, 
  CloudSun, 
  Layers, 
  Palette, 
  Shirt, 
  ChevronRight, 
  Loader2,
  ArrowLeft,
  Camera,
  Upload,
  Globe
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { UserPreferences, OutfitSuggestion } from './types';
import { generateOutfit, generateOutfitImage, analyzeImage } from './services/geminiService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [step, setStep] = useState<'welcome' | 'form' | 'loading' | 'result'>('welcome');
  const [preferences, setPreferences] = useState<UserPreferences>({
    occasion: 'casual',
    gender: 'female',
    generation: 'genz',
    bodyType: 'average',
    complexion: 'medium',
    fabric: 'cotton',
    countryStyle: 'Parisian Chic',
  });
  const [suggestion, setSuggestion] = useState<OutfitSuggestion | null>(null);
  const [outfitImage, setOutfitImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [weather, setWeather] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
          );
          const data = await response.json();
          setPreferences(prev => ({ ...prev, countryStyle: data.countryName || prev.countryStyle }));
        } catch (e) {
          console.error("Failed to get location", e);
        }
      });
    }
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const analysis = await analyzeImage(base64);
        setPreferences(prev => ({
          ...prev,
          bodyType: analysis.bodyType,
          complexion: analysis.complexion,
          countryStyle: analysis.suggestedStyle,
        }));
        alert("AI Analysis Complete: We've updated your profile based on your photo!");
      } catch (error) {
        console.error("Analysis failed", error);
        alert("Could not analyze image. Please try again or fill manually.");
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setStep('loading');
    try {
      const result = await generateOutfit({ ...preferences, weather });
      setSuggestion(result);
      const imageUrl = await generateOutfitImage(result.imagePrompt);
      setOutfitImage(imageUrl);
      setStep('result');
    } catch (error) {
      console.error("Generation failed", error);
      setStep('form');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-6 flex justify-between items-center border-b border-ink/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-peach-accent rounded-full flex items-center justify-center">
            <Sparkles className="text-white w-4 h-4" />
          </div>
          <span className="font-serif text-xl tracking-widest uppercase font-semibold">Vogue AI</span>
        </div>
        <nav className="hidden md:flex gap-8 text-xs uppercase tracking-widest font-medium">
          <a href="#" className="hover:opacity-50 transition-opacity">Collections</a>
          <a href="#" className="hover:opacity-50 transition-opacity">Trends</a>
          <a href="#" className="hover:opacity-50 transition-opacity">About</a>
        </nav>
      </header>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <motion.section
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col md:flex-row"
            >
              <div className="flex-1 p-8 md:p-20 flex flex-col justify-center gap-8">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="text-xs uppercase tracking-[0.3em] font-semibold opacity-60 mb-4 block">
                    Personalized Styling
                  </span>
                  <h1 className="text-6xl md:text-8xl font-serif leading-[0.9] mb-8">
                    Your Style,<br />
                    <span className="italic">Redefined.</span>
                  </h1>
                  <p className="max-w-md text-lg opacity-80 leading-relaxed mb-10">
                    Experience the future of fashion. Our AI stylist crafts the perfect look tailored to your unique identity, occasion, and environment.
                  </p>
                  <button 
                    onClick={() => setStep('form')}
                    className="btn-primary group flex items-center gap-3"
                  >
                    Start Styling
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              </div>
              <div className="flex-1 relative hidden md:block">
                <img 
                  src="https://picsum.photos/seed/fashion-peach/1200/1600" 
                  alt="Fashion Hero" 
                  className="absolute inset-0 w-full h-full object-cover grayscale-0 hover:scale-105 transition-all duration-1000"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-peach-bg via-transparent to-transparent" />
              </div>
            </motion.section>
          )}

          {step === 'form' && (
            <motion.section
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto w-full p-8 py-12"
            >
              <div className="mb-12 text-center relative">
                <h2 className="text-4xl font-serif mb-2">The Style Brief</h2>
                <p className="opacity-60 uppercase text-[10px] tracking-[0.2em]">Tell us who you are and where you're going</p>
                
                {/* AI Analysis Button */}
                <div className="mt-6 flex justify-center">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isAnalyzing}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-peach-accent/20 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-peach-accent hover:text-white transition-all shadow-sm"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                    {isAnalyzing ? "Analyzing Features..." : "Analyze My Photo"}
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Occasion & Gender */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold">
                      <Shirt className="w-4 h-4" /> Occasion
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['casual', 'office', 'party', 'wedding', 'date', 'gym'].map((o) => (
                        <button
                          key={o}
                          onClick={() => setPreferences({ ...preferences, occasion: o as any })}
                          className={cn(
                            "py-3 px-4 rounded-xl text-sm capitalize transition-all border",
                            preferences.occasion === o 
                              ? "bg-peach-accent text-white border-peach-accent" 
                              : "bg-white border-peach-accent/10 hover:border-peach-accent/30"
                          )}
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold">
                      <User className="w-4 h-4" /> Gender & Generation
                    </label>
                    <div className="flex gap-2">
                      {['male', 'female', 'non-binary'].map((g) => (
                        <button
                          key={g}
                          onClick={() => setPreferences({ ...preferences, gender: g as any })}
                          className={cn(
                            "flex-1 py-2 rounded-full text-xs capitalize border",
                            preferences.gender === g ? "bg-peach-accent text-white" : "bg-white border-peach-accent/10"
                          )}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {['alpha', 'genz', 'millennial', 'genx'].map((gen) => (
                        <button
                          key={gen}
                          onClick={() => setPreferences({ ...preferences, generation: gen as any })}
                          className={cn(
                            "flex-1 py-2 rounded-full text-xs capitalize border",
                            preferences.generation === gen ? "bg-peach-accent text-white" : "bg-white border-peach-accent/10"
                          )}
                        >
                          {gen}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold">
                      <Globe className="w-4 h-4" /> Regional Style
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Indian', 'American', 'Korean'].map((region) => (
                        <button
                          key={region}
                          onClick={() => setPreferences({ ...preferences, countryStyle: region })}
                          className={cn(
                            "py-2 rounded-lg text-xs border transition-all",
                            preferences.countryStyle.toLowerCase().includes(region.toLowerCase())
                              ? "bg-peach-accent text-white" 
                              : "bg-white border-peach-accent/10"
                          )}
                        >
                          {region}
                        </button>
                      ))}
                    </div>
                    <input 
                      type="text"
                      placeholder="Or specify custom style..."
                      className="input-field text-sm"
                      value={preferences.countryStyle}
                      onChange={(e) => setPreferences({ ...preferences, countryStyle: e.target.value })}
                    />
                  </div>
                </div>

                {/* Body & Preferences */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold">
                      <Layers className="w-4 h-4" /> Body Type & Fabric
                    </label>
                    <select 
                      className="input-field"
                      value={preferences.bodyType}
                      onChange={(e) => setPreferences({ ...preferences, bodyType: e.target.value as any })}
                    >
                      <option value="slim">Slim</option>
                      <option value="athletic">Athletic</option>
                      <option value="average">Average</option>
                      <option value="curvy">Curvy</option>
                      <option value="plus-size">Plus Size</option>
                    </select>
                    <select 
                      className="input-field"
                      value={preferences.fabric}
                      onChange={(e) => setPreferences({ ...preferences, fabric: e.target.value as any })}
                    >
                      <option value="cotton">Cotton (Breathable)</option>
                      <option value="linen">Linen (Lightweight)</option>
                      <option value="silk">Silk (Luxurious)</option>
                      <option value="wool">Wool (Warm)</option>
                      <option value="denim">Denim (Durable)</option>
                      <option value="synthetic">Synthetic (Performance)</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold">
                      <Palette className="w-4 h-4" /> Complexion
                    </label>
                    <div className="flex gap-4 justify-between">
                      {[
                        { id: 'fair', color: '#FDF5E6' },
                        { id: 'medium', color: '#E6C1A3' },
                        { id: 'olive', color: '#C59A6F' },
                        { id: 'tan', color: '#A67B5B' },
                        { id: 'deep', color: '#4A2C2A' }
                      ].map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setPreferences({ ...preferences, complexion: c.id as any })}
                          className={cn(
                            "w-10 h-10 rounded-full border-2 transition-all",
                            preferences.complexion === c.id ? "border-peach-accent scale-110" : "border-transparent"
                          )}
                          style={{ backgroundColor: c.color }}
                          title={c.id}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold">
                      <CloudSun className="w-4 h-4" /> Weather Context
                    </label>
                    <input 
                      type="text"
                      placeholder="Current weather (e.g. Sunny 25°C)"
                      className="input-field text-sm"
                      value={weather}
                      onChange={(e) => setWeather(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-16 flex justify-center">
                <button 
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="btn-primary min-w-[240px] flex items-center justify-center gap-3"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Generate My Look"}
                </button>
              </div>
            </motion.section>
          )}

          {step === 'loading' && (
            <motion.section
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="relative w-24 h-24 mb-8">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-t-2 border-peach-accent rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 animate-pulse" />
                </div>
              </div>
              <h2 className="text-3xl font-serif mb-4">Curating Your Wardrobe</h2>
              <p className="max-w-xs opacity-60 text-sm leading-relaxed">
                Our AI is analyzing your preferences, body type, and current trends to craft the perfect ensemble.
              </p>
            </motion.section>
          )}

          {step === 'result' && suggestion && (
            <motion.section
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col md:flex-row"
            >
              {/* Image Side */}
              <div className="flex-1 h-[60vh] md:h-auto relative bg-peach-accent/5">
                {outfitImage ? (
                  <img 
                    src={outfitImage} 
                    alt="Suggested Outfit" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                    <Camera className="w-12 h-12 opacity-20 mb-4" />
                    <p className="text-sm opacity-40">Visualizing your look...</p>
                  </div>
                )}
                <div className="absolute top-8 left-8">
                  <button 
                    onClick={() => setStep('form')}
                    className="bg-white/80 backdrop-blur-md p-3 rounded-full hover:bg-white transition-colors shadow-sm"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content Side */}
              <div className="flex-1 p-8 md:p-16 overflow-y-auto max-h-screen">
                <div className="max-w-xl">
                  <span className="text-xs uppercase tracking-[0.3em] font-semibold opacity-60 mb-4 block">
                    The Recommendation
                  </span>
                  <h2 className="text-5xl font-serif mb-6">{suggestion.title}</h2>
                  <p className="text-lg opacity-80 leading-relaxed mb-10">
                    {suggestion.description}
                  </p>

                  <div className="space-y-12">
                    {/* Items */}
                    <section>
                      <h3 className="text-xs uppercase tracking-widest font-bold mb-6 border-b border-peach-accent/10 pb-2">The Ensemble</h3>
                      <div className="space-y-6">
                        {suggestion.items.map((item, idx) => (
                          <div key={idx} className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-peach-accent/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] font-bold text-peach-accent">{idx + 1}</span>
                            </div>
                            <div>
                              <p className="text-xs uppercase font-bold opacity-40 mb-1">{item.category}</p>
                              <p className="font-medium mb-1">{item.item}</p>
                              <p className="text-sm opacity-60 leading-relaxed">{item.reason}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Palette */}
                    <section>
                      <h3 className="text-xs uppercase tracking-widest font-bold mb-6 border-b border-peach-accent/10 pb-2">Color Palette</h3>
                      <div className="flex gap-3">
                        {suggestion.colorPalette.map((color, idx) => (
                          <div key={idx} className="group relative">
                            <div 
                              className="w-12 h-12 rounded-full border border-peach-accent/10 shadow-sm"
                              style={{ backgroundColor: color }}
                            />
                            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] uppercase font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {color}
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Styling Tips */}
                    <section>
                      <h3 className="text-xs uppercase tracking-widest font-bold mb-6 border-b border-peach-accent/10 pb-2">Styling Tips</h3>
                      <ul className="space-y-3">
                        {suggestion.stylingTips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm opacity-80">
                            <div className="w-1.5 h-1.5 rounded-full bg-peach-accent mt-1.5 flex-shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>

                  <div className="mt-16 pt-8 border-t border-peach-accent/10 flex gap-4">
                    <button 
                      onClick={() => setStep('form')}
                      className="btn-secondary flex-1"
                    >
                      Refine
                    </button>
                    <button 
                      onClick={() => window.print()}
                      className="btn-primary flex-1"
                    >
                      Save Look
                    </button>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="p-6 text-[10px] uppercase tracking-[0.2em] opacity-40 flex justify-between items-center border-t border-ink/5">
        <span>© 2026 Vogue AI Stylist</span>
        <div className="flex gap-6">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Contact</a>
        </div>
      </footer>
    </div>
  );
}
