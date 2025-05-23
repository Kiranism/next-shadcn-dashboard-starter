'use client';

import { ArrowBigLeft, CurrencyIcon, MapIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

interface CandidateCardProps {
  candidateImage: string;
  candidateName: string;
  candidateProfessional?: string;
  candidateLocation?: string;
  candidateSalary?: string;
  candidateSkills?: string[];
  candidateDescription: string;
  link: string;
  openJobs?: number;
  isProMember?: boolean;
}

const CandidateCard: React.FC<CandidateCardProps> = ({
  candidateImage,
  candidateName,
  candidateProfessional,
  candidateLocation,
  candidateSalary,
  candidateSkills,
  candidateDescription,
  link,
  openJobs,
  isProMember = false
}) => {
  return (
    <div className='flex flex-col rounded-2xl border border-gray-300 p-6 shadow-md transition-all hover:border-orange-600'>
      <div className='flex items-center'>
        <Image
          src={candidateImage}
          alt={candidateName}
          className='h-[100px] w-[100px] rounded-full'
          width={100}
          height={100}
        />
        <div className='ml-4'>
          <div className='mb-3 flex items-center gap-x-3'>
            <h2 className='text-2xl font-bold text-black capitalize'>
              {candidateName}
            </h2>
            {isProMember && (
              <span>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='30'
                  height='30'
                  fill='none'
                  viewBox='0 0 30 30'
                >
                  <rect width='30' height='30' fill='#007AB5' rx='15'></rect>
                  <path
                    fill='#fff'
                    d='M21.431 11.6a.99.99 0 0 0-1.181.237l-2.104 2.268-2.238-5.018V9.08a1 1 0 0 0-1.816 0v.006l-2.238 5.018-2.104-2.268a1 1 0 0 0-1.73.859l1.418 6.492a1 1 0 0 0 .982.812h9.16a1 1 0 0 0 .983-.812l1.417-6.492q-.001-.01.004-.02a.99.99 0 0 0-.553-1.076m-1.847 7.38-.003.02h-9.162l-.003-.02L9 12.5l.009.01 2.625 2.828a.5.5 0 0 0 .823-.137L15 9.5l2.543 5.703a.5.5 0 0 0 .824.136l2.625-2.827L21 12.5z'
                  ></path>
                </svg>
              </span>
            )}
          </div>
          {candidateProfessional && (
            <p className='font-medium text-orange-600'>
              {candidateProfessional}
            </p>
          )}
        </div>
      </div>
      <div className='my-6 flex'>
        {candidateLocation && (
          <div className='flex gap-x-2 text-black'>
            <div>
              <MapIcon />
            </div>
            {candidateLocation}
          </div>
        )}
        {candidateSalary && (
          <div className='ml-6 flex gap-x-2 text-black'>
            <CurrencyIcon />
            {candidateSalary}
          </div>
        )}
      </div>
      {candidateSkills && (
        <div className='mb-6'>
          <ul className='flex flex-wrap gap-2'>
            {candidateSkills.slice(0, 4).map((skill, index) => (
              <li
                key={index}
                className='inline-block rounded-full border border-gray-300 px-6 py-3 text-base font-normal text-gray-100'
              >
                {skill}
              </li>
            ))}
            {candidateSkills.length > 4 && (
              <li className='flex h-[44px] w-[60px] items-center justify-center rounded-full bg-orange-600 text-base font-normal text-white'>
                +{candidateSkills.length - 4}
              </li>
            )}
          </ul>
        </div>
      )}
      <div className='mb-4'>
        <p className='text-black-100 line-clamp-3 text-base break-words'>
          {candidateDescription}
        </p>
      </div>
      <div className='mt-auto'>
        {openJobs ? (
          <div className='mb-4'>
            <span className='bg-offWhite-100 inline-block rounded-full px-5 py-2 text-orange-600'>
              Open Jobs - {openJobs}
            </span>
          </div>
        ) : null}
        <Link
          href={link}
          className='flex items-center justify-center gap-x-2 rounded-full border border-orange-600 p-4 text-orange-600 hover:bg-orange-600 hover:text-white'
        >
          View Profile <ArrowBigLeft />
        </Link>
      </div>
    </div>
  );
};

export default CandidateCard;
