'use client';

interface HeaderProps {
  title: string;
}

export function DashboardHeader({ title }: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          {/* JCM Logo */}
          <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center shadow-md overflow-hidden flex-shrink-0">
            <img
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 400'%3E%3Crect width='300' height='400' fill='%231e40af'/%3E%3Ctext x='150' y='200' font-size='80' font-weight='bold' text-anchor='middle' fill='%23ffffff'%3EJCM%3C/text%3E%3C/svg%3E"
              alt="JCM Logo"
              width={80}
              height={80}
              className="w-20 h-20 object-cover"
            />
          </div>
          
          {/* Title Section - Only Dashboard Title */}
          <div>
            <h1 className="text-4xl font-bold">{title}</h1>
          </div>
        </div>
      </div>
    </header>
  );
}

