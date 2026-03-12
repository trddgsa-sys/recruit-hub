'use client';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/Spinner';
import { Save, Upload, X, Plus } from 'lucide-react';

export default function CandidateProfilePage() {
  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    skills: [] as string[],
    experience: '',
    education: '',
    portfolioLinks: [] as string[],
    resumeUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [newSkill, setNewSkill] = useState('');
  const [newLink, setNewLink] = useState('');

  useEffect(() => {
    fetch('/api/candidates/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const d = data.data;
          setProfile({
            name: d.user?.name ?? '',
            phone: d.phone ?? '',
            skills: d.skills ?? [],
            experience: d.experience ?? '',
            education: d.education ?? '',
            portfolioLinks: d.portfolioLinks ?? [],
            resumeUrl: d.resumeUrl ?? '',
          });
        }
        setLoading(false);
      });
  }, []);

  const save = async () => {
    setSaving(true);
    setMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/candidates/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (data.success) setMsg({ type: 'success', text: 'Profile saved!' });
      else setMsg({ type: 'error', text: data.error ?? 'Save failed' });
    } catch {
      setMsg({ type: 'error', text: 'Something went wrong' });
    } finally {
      setSaving(false);
    }
  };

  const uploadResume = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('resume', file);
    try {
      const res = await fetch('/api/candidates/upload-resume', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setProfile((p) => ({ ...p, resumeUrl: data.data.resumeUrl }));
        setMsg({ type: 'success', text: 'Resume uploaded!' });
      } else {
        setMsg({ type: 'error', text: data.error ?? 'Upload failed' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile((p) => ({ ...p, skills: [...p.skills, newSkill.trim()] }));
      setNewSkill('');
    }
  };

  const removeSkill = (s: string) => setProfile((p) => ({ ...p, skills: p.skills.filter((sk) => sk !== s) }));

  const addLink = () => {
    if (newLink.trim()) {
      setProfile((p) => ({ ...p, portfolioLinks: [...p.portfolioLinks, newLink.trim()] }));
      setNewLink('');
    }
  };

  const removeLink = (l: string) => setProfile((p) => ({ ...p, portfolioLinks: p.portfolioLinks.filter((pl) => pl !== l) }));

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Profile</h1>

      {msg.text && (
        <div className={`rounded-lg px-4 py-3 text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
          {msg.text}
        </div>
      )}

      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900 dark:text-gray-100">Personal Info</h2></CardHeader>
        <CardBody className="space-y-4">
          <Input label="Full Name" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
          <Input label="Phone" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="+1-555-0100" />
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900 dark:text-gray-100">Resume</h2></CardHeader>
        <CardBody>
          {profile.resumeUrl && (
            <p className="text-sm text-gray-500 mb-3">Current: <a href={profile.resumeUrl} className="text-indigo-600 hover:underline" target="_blank">{profile.resumeUrl.split('/').pop()}</a></p>
          )}
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 px-6 py-4 text-center hover:border-indigo-400 transition-colors w-full">
              <Upload className="mx-auto h-6 w-6 text-gray-400 mb-1" />
              <p className="text-sm text-gray-500">{uploading ? 'Uploading...' : 'Click to upload PDF or Word document'}</p>
            </div>
            <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => e.target.files?.[0] && uploadResume(e.target.files[0])} disabled={uploading} />
          </label>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900 dark:text-gray-100">Skills</h2></CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-2 mb-3">
            {profile.skills.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 text-sm text-indigo-700 dark:text-indigo-400">
                {s}
                <button onClick={() => removeSkill(s)} className="text-indigo-400 hover:text-indigo-600"><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Add a skill" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())} />
            <Button variant="secondary" onClick={addSkill} disabled={!newSkill.trim()}><Plus className="h-4 w-4" /></Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900 dark:text-gray-100">Experience & Education</h2></CardHeader>
        <CardBody className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Experience</label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={3}
              value={profile.experience}
              onChange={(e) => setProfile((p) => ({ ...p, experience: e.target.value }))}
              placeholder="Describe your work experience..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Education</label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={2}
              value={profile.education}
              onChange={(e) => setProfile((p) => ({ ...p, education: e.target.value }))}
              placeholder="Your degrees, certifications..."
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900 dark:text-gray-100">Portfolio Links</h2></CardHeader>
        <CardBody>
          <div className="space-y-2 mb-3">
            {profile.portfolioLinks.map((l) => (
              <div key={l} className="flex items-center gap-2 text-sm">
                <a href={l} target="_blank" className="text-indigo-600 hover:underline truncate flex-1">{l}</a>
                <button onClick={() => removeLink(l)} className="text-gray-400 hover:text-red-500"><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="https://github.com/you" value={newLink} onChange={(e) => setNewLink(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())} />
            <Button variant="secondary" onClick={addLink} disabled={!newLink.trim()}><Plus className="h-4 w-4" /></Button>
          </div>
        </CardBody>
      </Card>

      <Button onClick={save} loading={saving} size="lg">
        <Save className="h-4 w-4" /> Save Profile
      </Button>
    </div>
  );
}
