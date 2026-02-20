import React from 'react';

const ReadingRoomRules = () => {
  const rules = [
    {
      title: 'Monthly Seat Reservation & Advance Booking',
      content: `If a student books a seat for a full month, that seat will remain exclusively reserved for them during that month. To retain the same seat for subsequent months, students must book in advance. InhaleStays is not responsible for any seat loss due to delayed renewal.`
    },
    {
      title: 'Cabin Transfers Not Allowed',
      content: `Seat or cabin transfers are not permitted once a booking is confirmed. Students are advised to select their seats carefully.`
    },
    {
      title: 'One-Month Bookings & Availability',
      content: `Bookings made for just one month do not guarantee seat availability for the next month unless renewed in advance. Longer-term or timely re-booking is recommended.`
    },
    {
      title: 'Cancellations & Transfers',
      content: `Cancellations or transfers of seats are not allowed, except under exceptional circumstances at the sole discretion of InhaleStays.`
    },
    {
      title: 'Belongings After Expiry',
      content: `InhaleStays is not liable for any personal items left behind after a booking has expired. Students must clear all belongings promptly at the end of their reservation.`
    },
    {
      title: 'Student Photo Upload Policy',
      content: `After completing payment, each student is required to upload a clear photo to their student dashboard. This photo will serve as official ID for the duration of their stay and cannot be changed at any point.`
    },
    {
      title: 'Unauthorized Seat Sharing Policy',
      content: `If a student is found unauthorizedly allowing another individual to use their reserved seat, it will result in immediate cancellation of their booking. InhaleStays reserves the right to suspend or permanently restrict future access for such violations.`
    }
  ];

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md overflow-auto max-h-[40vh]">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">📖 Reading Room Rules</h2>
      <p className="text-sm text-gray-600 mb-6 italic">
        To ensure a secure, fair, and academically focused environment for all users of InhaleStays' reading rooms, the following rules apply:
      </p>
      <ol className="list-decimal space-y-4 pl-6 text-gray-700">
        {rules.map((rule, index) => (
          <li key={index}>
            <p className="font-semibold italic">{rule.title}</p>
            <p className="text-sm mt-1">{rule.content}</p>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default ReadingRoomRules;
