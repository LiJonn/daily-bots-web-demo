import React from 'react';
import styles from './styles.module.css';

const Checklist: React.FC<{ userResponses: any }> = ({ userResponses }) => {
  return (
    <div className={styles.container}>
      <h2 className={styles.header}>Intake Checklist</h2>
      <ul className={styles.checklist}>
        <li className={styles.checklistItem}>
          <span className={userResponses.isNameChecked ? styles.checked : styles.unchecked}>
            {userResponses.isNameChecked ? '✔' : '○'}
          </span>
          <div className={styles.checklistContent}>
            <div className={userResponses.isNameChecked ? styles.labelChecked : styles.labelUnchecked}>
              Verify identity
            </div>
            <p className={styles.description}>
              {userResponses.isNameChecked ? userResponses.name : ''}
            </p>
          </div>
        </li>

        <li className={styles.checklistItem}>
          <span className={userResponses.prescriptions ? styles.checked : styles.unchecked}>
            {userResponses.prescriptions ? '✔' : '○'}
          </span>
          <div className={styles.checklistContent}>
            <div className={userResponses.prescriptions ? styles.labelChecked : styles.labelUnchecked}>
              List prescriptions
            </div>
            <p className={styles.description}>
              {userResponses.prescriptions ? userResponses.prescriptions : ''}
            </p>
          </div>
        </li>

        <li className={styles.checklistItem}>
          <span className={userResponses.allergies ? styles.checked : styles.unchecked}>
            {userResponses.allergies ? '✔' : '○'}
          </span>
          <div className={styles.checklistContent}>
            <div className={userResponses.allergies ? styles.labelChecked : styles.labelUnchecked}>
              List allergies
            </div>
            <p className={styles.description}>
              {userResponses.allergies ? userResponses.allergies : ''}
            </p>
          </div>
        </li>

        <li className={styles.checklistItem}>
          <span className={userResponses.medicalConditions ? styles.checked : styles.unchecked}>
            {userResponses.medicalConditions ? '✔' : '○'}
          </span>
          <div className={styles.checklistContent}>
            <div className={userResponses.medicalConditions ? styles.labelChecked : styles.labelUnchecked}>
              List medical conditions
            </div>
            <p className={styles.description}>
              {userResponses.medicalConditions ? userResponses.medicalConditions : ''}
            </p>
          </div>
        </li>

        <li className={styles.checklistItem}>
          <span className={userResponses.reasonsForVisit ? styles.checked : styles.unchecked}>
            {userResponses.reasonsForVisit ? '✔' : '○'}
          </span>
          <div className={styles.checklistContent}>
            <div className={userResponses.reasonsForVisit ? styles.labelChecked : styles.labelUnchecked}>
              List reasons for visit
            </div>
            <p className={styles.description}>
              {userResponses.reasonsForVisit ? userResponses.reasonsForVisit : ''}
            </p>
          </div>
        </li>
      </ul>
    </div>
  );
};

export default Checklist;
