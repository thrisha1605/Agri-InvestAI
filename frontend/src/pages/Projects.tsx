import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { listProjects } from '@/lib/appData';

export function Projects() {
  const projects = listProjects().filter(
    (p) =>
      p.approvalStage === 'APPROVED' ||
      (p as any).approvalStatus === 'APPROVED' ||
      p.farmerId.startsWith('user_')
  );

  const fallbackImage =
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&h=600&fit=crop';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Projects</h1>
          <p className="text-gray-600">Approved farmer projects available for investment and helper requests.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const coverImage =
              project.images?.find((img) => typeof img === 'string' && img.trim().length > 0) ||
              fallbackImage;

            return (
              <Card key={project.id} className="overflow-hidden">
                <img src={coverImage} alt={project.title} className="h-48 w-full object-cover" />
                <CardContent className="p-5 space-y-3">
                  <h2 className="text-xl font-semibold">{project.title}</h2>
                  <p className="text-sm text-gray-600">{project.farmerName} • {project.location}</p>
                  <p className="text-sm">{project.cropType} • {project.acreage} acres • {project.soilType}</p>
                  <p className="text-sm">Funding: ₹{project.fundedAmount.toLocaleString('en-IN')} / ₹{project.fundingGoal.toLocaleString('en-IN')}</p>
                  <div className="flex gap-2">
                    <Button asChild className="flex-1">
                      <Link to={`/projects/${project.id}`}>View</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
