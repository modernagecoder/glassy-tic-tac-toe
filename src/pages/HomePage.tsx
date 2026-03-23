import React from 'react';
import { Game } from './GamePage';

export function HomePage() {
  return (
    <div className="flex-grow flex flex-col">
      {/* Game Section - First Screen */}
      <Game />
    </div>
  );
}
