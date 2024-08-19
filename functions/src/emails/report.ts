// Typescript:
import type { Report } from 'types/comments-and-replies'

// Exports:
export const EMAIL_FOR_REPORTER_REPORTED_CONTENT_REMOVED = (
  reporterUsername: string,
  reportedUsername: string,
  report: Report,
) => `<table cellpadding="0" cellspacing="0" border="0" width="100%"
  style="font-family: 'Inter', Arial, 'Helvetica Neue', Helvetica, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <tr>
    <td style="background-color: #f9f9f9; padding: 30px; color: #0F172A; font-weight: 500;">
      <p>Hi ${ reporterUsername },</p>
      <p>We received your report regarding
        <a target="_blank" href="https://openreply.app/user/${ reportedUsername }" style="font-weight: bold; color: rebbecapurple;">${ reportedUsername }</a>'s
        <a target="_blank" href="https://openreply.app/${ report.URLHash }/${ report.replyID ? `${ report.commentID }/${ report.replyID }` : report.commentID }" style="font-weight: bold; color: rebbecapurple;">${ report.replyID ? 'reply' : 'comment' }</a>. We appreciate you taking the time to bring this to our
        attention.</p>
      <p>After careful review, we have determined that the content violates our <a target="_blank"
          href="https://openreply.app/community-standards"
          style="font-weight: bold; color: rebbecapurple; text-decoration: none;">Community Standards</a>. As a result,
        we have removed the ${ report.replyID ? 'reply' : 'comment' } from our platform.</p>
      <p>We strive to maintain a safe and respectful environment for all our users. Your vigilance helps us achieve this
        goal.</p>
      <p>If you encounter any other content that appears to violate our <a target="_blank" href="https://openreply.app/community-standards" style="font-weight: bold; color: rebbecapurple; text-decoration: none;">Community Standards</a> in the future, please don't
        hesitate to report it. Your input is valuable in keeping our community safe and welcoming.</p>
      <p>Thank you for being an active member of our community.</p>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 30px;">
        <tr>
          <td style="font-size: 14px; color: #666666;">
            <p>Best regards,<br>The OpenReply Team</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`

export const EMAIL_FOR_REPORTER_REPORTED_CONTENT_HIDDEN = (
  reporterUsername: string,
  reportedUsername: string,
  report: Report,
) => `<table cellpadding="0" cellspacing="0" border="0" width="100%"
  style="font-family: 'Inter', Arial, 'Helvetica Neue', Helvetica, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <tr>
    <td style="background-color: #f9f9f9; padding: 30px; color: #0F172A; font-weight: 500;">
      <p>Hi ${ reporterUsername },</p>
      <p>We received your report regarding
        <a target="_blank" href="https://openreply.app/user/${ reportedUsername }"
          style="font-weight: bold; color: rebbecapurple;">${ reportedUsername }</a>'s
        <a target="_blank"
          href="https://openreply.app/${ report.URLHash }/${ report.replyID ? `${ report.commentID }/${ report.replyID }` : report.commentID }"
          style="font-weight: bold; color: rebbecapurple;">${ report.replyID ? 'reply' : 'comment' }</a>.
        Thank you for bringing this to our attention.
      </p>
      <p>After careful review, we have determined that the content may be inappropriate for some users. As a result, we
        have hidden the ${ report.replyID ? 'reply' : 'comment' } from public view. It will only be visible to a few
        users on our platform.</p>
      <p>We strive to maintain a balance between free expression and community safety. This action helps us maintain
        that balance while respecting diverse viewpoints.</p>
      <p>Your vigilance helps us maintain a respectful environment for all users. If you encounter any other content
        that you believe violates our <a target="_blank" href="https://openreply.app/community-standards"
          style="font-weight: bold; color: rebbecapurple; text-decoration: none;">Community Standards</a>, please don't
        hesitate to report it.</p>
      <p>Thank you for being an active and caring member of our community.</p>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 30px;">
        <tr>
          <td style="font-size: 14px; color: #666666;">
            <p>Best regards,<br>The OpenReply Team</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`

export const EMAIL_FOR_REPORTER_REPORTED_CONTENT_NO_ACTION = (
  reporterUsername: string,
  reportedUsername: string,
  report: Report,
) => `<table cellpadding="0" cellspacing="0" border="0" width="100%"
  style="font-family: 'Inter', Arial, 'Helvetica Neue', Helvetica, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <tr>
    <td style="background-color: #f9f9f9; padding: 30px; color: #0F172A; font-weight: 500;">
      <p>Hi ${ reporterUsername },</p>
      <p>We received your report regarding
        <a target="_blank" href="https://openreply.app/user/${ reportedUsername }"
          style="font-weight: bold; color: rebbecapurple;">${ reportedUsername }</a>'s
        <a target="_blank"
          href="https://openreply.app/${ report.URLHash }/${ report.replyID ? `${ report.commentID }/${ report.replyID }` : report.commentID }"
          style="font-weight: bold; color: rebbecapurple;">${ report.replyID ? 'reply' : 'comment' }</a>.
        We appreciate you taking the time to share your concerns with us.
      </p>
      <p>After careful review, we have determined that the reported content does not violate our <a target="_blank"
          href="https://openreply.app/community-standards"
          style="font-weight: bold; color: rebbecapurple; text-decoration: none;">Community Standards</a>. As
        a result, we will not be taking any action on this ${ report.replyID ? 'reply' : 'comment' } at this time.</p>
      <p>We understand that you may disagree with this decision. Our community is diverse, and sometimes content that is
        disagreeable or offensive to some may not violate our overall standards.</p>
      <p>However, we want to assure you that we take all reports seriously. Your input helps us continually evaluate and
        improve our policies.</p>
      <p>If you encounter any other content that you believe violates our <a target="_blank"
          href="https://openreply.app/community-standards"
          style="font-weight: bold; color: rebbecapurple; text-decoration: none;">Community Standards</a>, please don't
        hesitate to
        report it. Your engagement helps keep our community safe and respectful.</p>
      <p>Thank you for your understanding and for being an active member of our community.</p>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 30px;">
        <tr>
          <td style="font-size: 14px; color: #666666;">
            <p>Best regards,<br>The OpenReply Team</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`

export const EMAIL_FOR_REPORTED_REPORTED_CONTENT_REMOVED = (
  reportedUsername: string,
  report: Report,
) => `<table cellpadding="0" cellspacing="0" border="0" width="100%"
  style="font-family: 'Inter', Arial, 'Helvetica Neue', Helvetica, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <tr>
    <td style="background-color: #f9f9f9; padding: 30px; color: #0F172A; font-weight: 500;">
      <p>Hi ${reportedUsername},</p>
      <p>We're writing to inform you that your ${report.replyID ? 'reply' : 'comment'} on OpenReply has been removed due
        to a violation of our <a href="https://openreply.app/community-standards"
          style="font-weight: bold; color: #663399; text-decoration: none;">Community Standards</a>.</p>
      <p>The content in question can be found here: <a
          href="https://openreply.app/${report.URLHash}/${report.replyID ? `${report.commentID}/${report.replyID}` : report.commentID}"
          style="font-weight: bold; color: #663399;">${report.replyID ? 'Reply' : 'Comment'} Link</a></p>
      <p>Our moderation team has carefully reviewed the reported content and determined that it does not align with our
        <a href="https://openreply.app/community-standards"
          style="font-weight: bold; color: #663399; text-decoration: none;">Community Standards</a>. As a result, we
        have removed the ${report.replyID ? 'reply' : 'comment'} from our
        platform.
      </p>
      <p>We encourage you to review our <a href="https://openreply.app/community-standards"
          style="font-weight: bold; color: #663399; text-decoration: none;">Community Standards</a> to ensure future
        contributions align with our guidelines. Our goal is to maintain a respectful and safe environment for all
        users.</p>
      <p>If you believe this decision was made in error, you can appeal by responding to this email with your
        explanation.</p>
      <p>Thank you for your understanding and cooperation in maintaining a positive community on OpenReply.</p>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 30px;">
        <tr>
          <td style="font-size: 14px; color: #666666;">
            <p>Best regards,<br>The OpenReply Team</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`

export const EMAIL_FOR_REPORTED_REPORTED_CONTENT_HIDDEN = (
  reportedUsername: string,
  report: Report,
) => `<table cellpadding="0" cellspacing="0" border="0" width="100%"
  style="font-family: 'Inter', Arial, 'Helvetica Neue', Helvetica, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <tr>
    <td style="background-color: #f9f9f9; padding: 30px; color: #0F172A; font-weight: 500;">
      <p>Hi ${reportedUsername},</p>
      <p>We're writing to inform you that your ${report.replyID ? 'reply' : 'comment'} on OpenReply has been hidden from
        public view due to concerns raised by our community.</p>
      <p>The content in question can be found here: <a
          href="https://openreply.app/${report.URLHash}/${report.replyID ? `${report.commentID}/${report.replyID}` : report.commentID}"
          style="font-weight: bold; color: #663399;">${report.replyID ? 'Reply' : 'Comment'} Link</a></p>
      <p>Our moderation team has reviewed the reported content and determined that it may be inappropriate for some
        users. As a result, we have limited the visibility of the ${report.replyID ? 'reply' : 'comment'}. It will only
        be visible to a select group of users on our platform.</p>
      <p>This action helps us maintain a balance between free expression and community safety while respecting diverse
        viewpoints. We encourage you to review our <a href="https://openreply.app/community-standards"
          style="font-weight: bold; color: #663399; text-decoration: none;">Community Standards</a> to ensure future
        contributions align with our guidelines.</p>
      <p>If you believe this decision was made in error, you can appeal by responding to this email with your
        explanation.</p>
      <p>We appreciate your cooperation in maintaining a respectful environment for all users on OpenReply.</p>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 30px;">
        <tr>
          <td style="font-size: 14px; color: #666666;">
            <p>Best regards,<br>The OpenReply Team</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`
