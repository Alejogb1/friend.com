import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function isValidGithubRepoUrl(url: string): boolean {
  const githubRepoPattern = /^https:\/\/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/;
  return githubRepoPattern.test(url);
}

export default function RepoInput({ onSubmit }: { onSubmit: (url: string) => void }) {
  const [repoUrl, setRepoUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (isValidGithubRepoUrl(repoUrl)) {
      onSubmit(repoUrl);
      setError('');
    } else {
      setError('Please enter a valid GitHub repository URL (e.g., https://github.com/username/repo-name)');
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter GitHub Repo URL</DialogTitle>
        </DialogHeader>
        <Input 
          value={repoUrl} 
          onChange={(e) => {
            setRepoUrl(e.target.value);
            setError('');
          }} 
          placeholder="https://github.com/username/repo-name"
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <Button onClick={handleSubmit}>Submit</Button>
      </DialogContent>
    </Dialog>
  );
}