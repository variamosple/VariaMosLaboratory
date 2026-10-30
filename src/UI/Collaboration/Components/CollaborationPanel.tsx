import ProjectCollaboration from './ProjectCollaboration';
import './CollaborationPanel.css';
import { ExperimentDetailed } from '@domain/Laboratory/Entities/Experiment';

type CollaborationPanelProps = {
  experiment: ExperimentDetailed;
};
export default function CollaborationPanel({experiment}: CollaborationPanelProps) {

    return (
      <div className="collaboration-panel">
        <div className="collaboration-header">
          <h6 className="collaboration-title">Collaboration</h6>
        </div>
        
        <div className="collaboration-content">
            <ProjectCollaboration experiment={experiment} />          
        </div>
      </div>
    );
}
